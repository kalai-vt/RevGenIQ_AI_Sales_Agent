"""Knowledge Base API — sources, documents, FAQs, crawl jobs."""
import os
import uuid as uuid_lib
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import AuthContext, require_tenant
from app.db.session import get_db
from app.models.knowledge import CrawlJob, KnowledgeChunk, KnowledgeSource, SourceStatus, SourceType, WebsitePage, CrawlFrequency

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class AddUrlRequest(BaseModel):
    name: str
    url: str
    max_pages: int = 30
    crawl_frequency: str = "never"

class AddFaqRequest(BaseModel):
    name: str
    content: str

class RecrawlRequest(BaseModel):
    max_pages: Optional[int] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fmt(s: KnowledgeSource) -> dict:
    return {
        "id": str(s.id),
        "name": s.name,
        "source_type": s.source_type.value,
        "url": s.url,
        "status": s.status.value,
        "chunk_count": s.chunk_count,
        "file_size": s.file_size,
        "error_message": s.error_message,
        "crawl_frequency": s.crawl_frequency.value if s.crawl_frequency else "never",
        "last_crawled_at": s.last_crawled_at.isoformat() if s.last_crawled_at else None,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


def _fmt_page(p: WebsitePage) -> dict:
    return {
        "id": str(p.id),
        "url": p.url,
        "title": p.title,
        "status": p.status.value,
        "chunk_count": p.chunk_count,
        "error_message": p.error_message,
        "last_crawled_at": p.last_crawled_at.isoformat() if p.last_crawled_at else None,
    }


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def stats(
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    tid = auth.tenant_id
    total_sources = (await db.execute(select(func.count(KnowledgeSource.id)).where(KnowledgeSource.tenant_id == tid))).scalar() or 0
    total_chunks  = (await db.execute(select(func.count(KnowledgeChunk.id)).where(KnowledgeChunk.tenant_id == tid))).scalar() or 0
    ready      = (await db.execute(select(func.count(KnowledgeSource.id)).where(KnowledgeSource.tenant_id == tid, KnowledgeSource.status == SourceStatus.ready))).scalar() or 0
    processing = (await db.execute(select(func.count(KnowledgeSource.id)).where(KnowledgeSource.tenant_id == tid, KnowledgeSource.status == SourceStatus.processing))).scalar() or 0
    failed     = (await db.execute(select(func.count(KnowledgeSource.id)).where(KnowledgeSource.tenant_id == tid, KnowledgeSource.status == SourceStatus.failed))).scalar() or 0
    return {"total_sources": total_sources, "total_chunks": total_chunks, "ready": ready, "processing": processing, "failed": failed}


# ── List sources ──────────────────────────────────────────────────────────────

@router.get("/sources")
async def list_sources(
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeSource)
        .where(KnowledgeSource.tenant_id == auth.tenant_id)
        .order_by(KnowledgeSource.created_at.desc())
    )
    return [_fmt(s) for s in result.scalars().all()]


# ── Source status ─────────────────────────────────────────────────────────────

@router.get("/sources/{source_id}/status")
async def source_status(
    source_id: str,
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeSource).where(
            KnowledgeSource.id == uuid_lib.UUID(source_id),
            KnowledgeSource.tenant_id == auth.tenant_id,
        )
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    job_info = None
    if source.source_type == SourceType.website:
        jr = await db.execute(select(CrawlJob).where(CrawlJob.source_id == source.id).order_by(CrawlJob.created_at.desc()).limit(1))
        job = jr.scalar_one_or_none()
        if job:
            job_info = {"status": job.status, "pages_crawled": job.pages_crawled, "pages_total": job.pages_total}

    return {**_fmt(source), "crawl_job": job_info}


# ── Add website URL ───────────────────────────────────────────────────────────

def _queue_crawl(background_tasks: BackgroundTasks, tenant_id: str, source_id: str, job_id: str, url: str, max_pages: int):
    async def _crawl():
        from app.db.session import AsyncSessionLocal
        from revgeniq_agent.crawler import CrawlerService
        async with AsyncSessionLocal() as bg:
            await CrawlerService(bg).crawl_website(tenant_id, source_id, job_id, url, max_pages)
            await bg.commit()

    background_tasks.add_task(_crawl)


@router.post("/sources/url")
async def add_url_source(
    req: AddUrlRequest,
    background_tasks: BackgroundTasks,
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    try:
        frequency = CrawlFrequency(req.crawl_frequency)
    except ValueError:
        frequency = CrawlFrequency.never

    source = KnowledgeSource(
        tenant_id=auth.tenant_id, name=req.name,
        source_type=SourceType.website, url=req.url, status=SourceStatus.pending,
        crawl_frequency=frequency, metadata_={"max_pages": req.max_pages},
    )
    db.add(source)
    job = CrawlJob(tenant_id=auth.tenant_id, source_id=source.id, url=req.url, status="pending")
    db.add(job)
    await db.commit()
    await db.refresh(source)
    await db.refresh(job)

    _queue_crawl(background_tasks, str(auth.tenant_id), str(source.id), str(job.id), req.url, req.max_pages)
    return {**_fmt(source), "message": "Crawl started"}


# ── Re-crawl (manual) ─────────────────────────────────────────────────────────

@router.post("/sources/{source_id}/recrawl")
async def recrawl_source(
    source_id: str,
    req: RecrawlRequest,
    background_tasks: BackgroundTasks,
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeSource).where(
            KnowledgeSource.id == uuid_lib.UUID(source_id),
            KnowledgeSource.tenant_id == auth.tenant_id,
            KnowledgeSource.source_type == SourceType.website,
        )
    )
    source = result.scalar_one_or_none()
    if not source or not source.url:
        raise HTTPException(status_code=404, detail="Website source not found")

    max_pages = req.max_pages or (source.metadata_ or {}).get("max_pages", 30)
    source.status = SourceStatus.processing
    job = CrawlJob(tenant_id=auth.tenant_id, source_id=source.id, url=source.url, status="pending")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    _queue_crawl(background_tasks, str(auth.tenant_id), str(source.id), str(job.id), source.url, max_pages)
    return {**_fmt(source), "message": "Re-crawl started"}


# ── Per-page crawl detail ─────────────────────────────────────────────────────

@router.get("/sources/{source_id}/pages")
async def list_pages(
    source_id: str,
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WebsitePage)
        .where(WebsitePage.source_id == uuid_lib.UUID(source_id), WebsitePage.tenant_id == auth.tenant_id)
        .order_by(WebsitePage.last_crawled_at.desc().nulls_last())
    )
    return [_fmt_page(p) for p in result.scalars().all()]


# ── Add FAQ ───────────────────────────────────────────────────────────────────

@router.post("/sources/faq")
async def add_faq(
    req: AddFaqRequest,
    background_tasks: BackgroundTasks,
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    source = KnowledgeSource(
        tenant_id=auth.tenant_id, name=req.name,
        source_type=SourceType.faq, status=SourceStatus.processing,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    sid, tid, content = str(source.id), str(auth.tenant_id), req.content

    async def _embed():
        from app.db.session import AsyncSessionLocal
        from revgeniq_agent.embeddings import EmbeddingService
        from app.models.knowledge import KnowledgeSource, SourceStatus
        async with AsyncSessionLocal() as bg:
            try:
                svc = EmbeddingService(bg)
                step = settings.MAX_CHUNK_SIZE - settings.CHUNK_OVERLAP
                chunks = [content[i:i + settings.MAX_CHUNK_SIZE] for i in range(0, len(content), step)] if len(content) > settings.MAX_CHUNK_SIZE else [content]
                vectors = await svc.embed_batch(chunks)
                await svc.store_chunks(tid, chunks, sid, vectors)
                r = await bg.execute(select(KnowledgeSource).where(KnowledgeSource.id == uuid_lib.UUID(sid)))
                src = r.scalar_one_or_none()
                if src:
                    src.status = SourceStatus.ready
                    src.chunk_count = len(chunks)
            except Exception as e:
                r = await bg.execute(select(KnowledgeSource).where(KnowledgeSource.id == uuid_lib.UUID(sid)))
                src = r.scalar_one_or_none()
                if src:
                    src.status = SourceStatus.failed
                    src.error_message = str(e)[:500]
            await bg.commit()

    background_tasks.add_task(_embed)
    return _fmt(source)


# ── Upload document ───────────────────────────────────────────────────────────

@router.post("/sources/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    name: str = Form(...),
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    ext = os.path.splitext(file.filename or "")[1].lower().strip(".")
    if ext not in ("pdf", "docx", "txt"):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files supported")

    type_map = {"pdf": SourceType.pdf, "docx": SourceType.docx, "txt": SourceType.txt}
    content = await file.read()
    file_size = len(content)

    if file_size > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit")

    source = KnowledgeSource(
        tenant_id=auth.tenant_id, name=name or file.filename,
        source_type=type_map[ext],
        file_size=file_size, status=SourceStatus.processing,
    )
    db.add(source)
    await db.commit()
    await db.refresh(source)
    sid, tid = str(source.id), str(auth.tenant_id)

    async def _process():
        from app.db.session import AsyncSessionLocal
        from app.services.document_service import DocumentService
        async with AsyncSessionLocal() as bg:
            await DocumentService(bg).process_document(tid, sid, content, ext)
            await bg.commit()

    background_tasks.add_task(_process)
    return _fmt(source)


# ── Delete source ─────────────────────────────────────────────────────────────

@router.delete("/sources/{source_id}")
async def delete_source(
    source_id: str,
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeSource).where(
            KnowledgeSource.id == uuid_lib.UUID(source_id),
            KnowledgeSource.tenant_id == auth.tenant_id,
        )
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    # Legacy rows from before uploads moved to in-memory processing may still
    # have a disk file_path — best-effort cleanup, harmless if it's already gone.
    if source.file_path and os.path.exists(source.file_path):
        os.remove(source.file_path)

    # KnowledgeSource.chunks has cascade="all, delete-orphan" — deleting the
    # source also deletes its chunks (and their embeddings, stored in the same
    # row) in one transaction. No separate vector-store cleanup call needed.
    await db.delete(source)
    await db.commit()
    return {"success": True}


# ── Search ────────────────────────────────────────────────────────────────────

@router.get("/search")
async def search(
    q: str = Query(..., min_length=2),
    top_k: int = Query(5, ge=1, le=20),
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    from revgeniq_agent.embeddings import EmbeddingService
    return await EmbeddingService(db).search_similar(str(auth.tenant_id), q, top_k)
