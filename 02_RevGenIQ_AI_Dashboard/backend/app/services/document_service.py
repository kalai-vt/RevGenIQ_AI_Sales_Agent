import io
import logging
import uuid as uuid_lib
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.knowledge import KnowledgeSource, SourceStatus
from app.core.config import settings

logger = logging.getLogger(__name__)


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_document(self, tenant_id: str, source_id: str, file_bytes: bytes, file_type: str):
        result = await self.db.execute(
            select(KnowledgeSource).where(KnowledgeSource.id == uuid_lib.UUID(source_id))
        )
        source = result.scalar_one_or_none()
        if not source:
            return

        source.status = SourceStatus.processing
        await self.db.flush()

        try:
            text = self._extract_text(file_bytes, file_type)
            chunks = self._chunk_text(text)

            from revgeniq_agent.embeddings import EmbeddingService
            embedding_svc = EmbeddingService(self.db)
            vectors = await embedding_svc.embed_batch(chunks)
            await embedding_svc.store_chunks(
                tenant_id=tenant_id,
                chunks=chunks,
                source_id=source_id,
                vectors=vectors,
            )

            source.chunk_count = len(chunks)
            source.status = SourceStatus.ready
            await self.db.flush()

        except Exception as exc:
            source.status = SourceStatus.failed
            source.error_message = str(exc)[:500]
            await self.db.flush()
            logger.error("Document processing failed for source %s: %s", source_id, exc)

    def _extract_text(self, file_bytes: bytes, file_type: str) -> str:
        if file_type in ("pdf",):
            return self._extract_pdf(file_bytes)
        elif file_type in ("docx",):
            return self._extract_docx(file_bytes)
        elif file_type in ("txt", "manual", "faq"):
            return self._extract_txt(file_bytes)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    def _extract_pdf(self, file_bytes: bytes) -> str:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    def _extract_docx(self, file_bytes: bytes) -> str:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

    def _extract_txt(self, file_bytes: bytes) -> str:
        return file_bytes.decode("utf-8", errors="ignore")

    def _chunk_text(self, text: str) -> list[str]:
        max_size = settings.MAX_CHUNK_SIZE
        overlap  = settings.CHUNK_OVERLAP

        if not text.strip():
            return []
        if len(text) <= max_size:
            return [text]

        chunks = []
        start = 0
        while start < len(text):
            end = start + max_size
            if end < len(text):
                boundary = text.rfind(" ", start, end)
                if boundary > start:
                    end = boundary
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            start = end - overlap
            if start <= 0:
                break

        return chunks
