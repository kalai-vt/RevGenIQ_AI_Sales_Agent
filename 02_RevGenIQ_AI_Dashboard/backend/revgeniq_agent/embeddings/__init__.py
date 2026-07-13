import logging
import uuid as uuid_lib
from datetime import datetime, timezone
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, text

from app.core.config import settings
from app.db.session import _is_sqlite
from app.models.knowledge import KnowledgeChunk

logger = logging.getLogger(__name__)


def _to_pgvector_literal(vector: List[float]) -> str:
    """pgvector accepts a text literal like '[0.1,0.2,...]' cast to ::vector —
    bound as a normal string parameter (not interpolated), so this is not a
    SQL-injection concern even though it builds a string."""
    return "[" + ",".join(repr(float(x)) for x in vector) + "]"


class EmbeddingService:
    """
    Retrieval-augmented generation backing store.

    Real semantic search runs on Postgres + pgvector (the same Neon database
    already used for everything else — no separate vector DB to provision or
    keep online). SQLite (local dev only) has no pgvector, so it uses a plain
    keyword scan instead; that's an acceptable trade for a dev environment
    that never needs production-grade retrieval quality.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self._client = None

    @property
    def client(self):
        if self._client is None:
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    async def embed_text(self, text: str) -> List[float]:
        response = await self.client.embeddings.create(
            model=settings.OPENAI_EMBEDDING_MODEL,
            input=text,
        )
        return response.data[0].embedding

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        all_embeddings: List[List[float]] = []
        batch_size = 20

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            try:
                response = await self.client.embeddings.create(
                    model=settings.OPENAI_EMBEDDING_MODEL,
                    input=batch,
                )
                all_embeddings.extend(item.embedding for item in response.data)
            except Exception as exc:
                logger.warning("Embedding batch %d failed, using zero vectors: %s", i // batch_size, exc)
                all_embeddings.extend([[0.0] * settings.EMBEDDING_DIMENSIONS] * len(batch))

        return all_embeddings

    async def store_chunks(
        self,
        tenant_id: str,
        chunks: List[str],
        source_id: str,
        vectors: List[List[float]],
        page_id: str | None = None,
        page_url: str | None = None,
        page_title: str | None = None,
        source_type: str | None = None,
    ):
        tid = uuid_lib.UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id
        sid = uuid_lib.UUID(source_id) if isinstance(source_id, str) else source_id
        pid = uuid_lib.UUID(page_id) if page_id else None
        chunk_ids: List[uuid_lib.UUID] = []

        for i, chunk in enumerate(chunks):
            chunk_id = uuid_lib.uuid4()
            kc = KnowledgeChunk(
                id=chunk_id,
                tenant_id=tid,
                source_id=sid,
                page_id=pid,
                page_url=page_url,
                page_title=page_title,
                source_type=source_type,
                chunk_text=chunk,
                chunk_index=i,
                created_at=datetime.now(timezone.utc),
            )
            self.db.add(kc)
            chunk_ids.append(chunk_id)

        await self.db.flush()

        if not _is_sqlite:
            try:
                for chunk_id, vector in zip(chunk_ids, vectors):
                    await self.db.execute(
                        text("UPDATE knowledge_chunks SET embedding = CAST(:emb AS vector) WHERE id = :id"),
                        {"emb": _to_pgvector_literal(vector), "id": chunk_id},
                    )
            except Exception as exc:
                logger.warning("Storing embeddings failed for source %s: %s", source_id, exc)

    async def search_similar(self, tenant_id: str, query: str, top_k: int = 5) -> List[dict]:
        try:
            cid = uuid_lib.UUID(tenant_id)
        except ValueError:
            return []

        if not _is_sqlite:
            try:
                query_vector = await self.embed_text(query)
                rows = (await self.db.execute(
                    text(
                        "SELECT chunk_text, source_id, page_url, page_title, source_type, "
                        "1 - (embedding <=> CAST(:qv AS vector)) AS score "
                        "FROM knowledge_chunks "
                        "WHERE tenant_id = :tid AND embedding IS NOT NULL "
                        "ORDER BY embedding <=> CAST(:qv AS vector) LIMIT :k"
                    ),
                    {"qv": _to_pgvector_literal(query_vector), "tid": cid, "k": top_k},
                )).all()
                if rows:
                    return [
                        {
                            "text": r.chunk_text, "score": float(r.score), "source_id": str(r.source_id),
                            "page_url": r.page_url, "page_title": r.page_title, "source_type": r.source_type,
                        }
                        for r in rows
                    ]
            except Exception as exc:
                logger.warning("Vector search failed for tenant %s, falling back to keyword search: %s", tenant_id, exc)

        # Keyword fallback — used for local SQLite dev, or if the vector query
        # above fails for any reason (e.g. no chunks have embeddings yet).
        keywords = [w for w in query.lower().split() if len(w) > 3]
        matched: List[dict] = []

        if keywords:
            conditions = [KnowledgeChunk.chunk_text.ilike(f"%{kw}%") for kw in keywords[:5]]
            result = await self.db.execute(
                select(KnowledgeChunk)
                .where(KnowledgeChunk.tenant_id == cid, or_(*conditions))
                .limit(top_k)
            )
            matched = [
                {"text": kc.chunk_text, "score": 0.5, "source_id": str(kc.source_id)}
                for kc in result.scalars().all()
            ]

        if not matched:
            result = await self.db.execute(
                select(KnowledgeChunk).where(KnowledgeChunk.tenant_id == cid).limit(top_k)
            )
            matched = [
                {"text": kc.chunk_text, "score": 0.5, "source_id": str(kc.source_id)}
                for kc in result.scalars().all()
            ]

        return matched[:top_k]
