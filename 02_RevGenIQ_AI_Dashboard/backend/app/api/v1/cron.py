"""
Scheduled re-crawl — called by Vercel Cron (see vercel.json "crons"), not by
any user. Vercel invokes cron endpoints with `Authorization: Bearer
<CRON_SECRET>`; anything else is rejected. Works across every tenant with no
tenant-specific code — it just looks for KnowledgeSource rows whose
crawl_frequency says they're due, regardless of which company owns them.
"""
import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Header, HTTPException
from sqlalchemy import select

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.knowledge import CrawlFrequency, CrawlJob, KnowledgeSource, SourceStatus, SourceType

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/internal/cron", tags=["internal"])

_INTERVALS = {
    CrawlFrequency.daily: timedelta(days=1),
    CrawlFrequency.weekly: timedelta(days=7),
    CrawlFrequency.monthly: timedelta(days=30),
}


def _is_due(source: KnowledgeSource, now: datetime) -> bool:
    interval = _INTERVALS.get(source.crawl_frequency)
    if not interval:
        return False
    if not source.last_crawled_at:
        return True
    last = source.last_crawled_at
    if last.tzinfo is None:
        last = last.replace(tzinfo=timezone.utc)
    return now - last >= interval


@router.get("/recrawl-due-sources")
async def recrawl_due_sources(authorization: str | None = Header(None)):
    if not settings.CRON_SECRET or authorization != f"Bearer {settings.CRON_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    from revgeniq_agent.crawler import CrawlerService

    now = datetime.now(timezone.utc)
    triggered = []

    async with AsyncSessionLocal() as db:
        sources = (await db.execute(
            select(KnowledgeSource).where(
                KnowledgeSource.source_type == SourceType.website,
                KnowledgeSource.crawl_frequency != CrawlFrequency.never,
            )
        )).scalars().all()

        due = [s for s in sources if _is_due(s, now)]

        for source in due:
            job = CrawlJob(tenant_id=source.tenant_id, source_id=source.id, url=source.url, status="pending")
            db.add(job)
            source.status = SourceStatus.processing
            await db.flush()

            max_pages = (source.metadata_ or {}).get("max_pages", 30)
            try:
                await CrawlerService(db).crawl_website(
                    str(source.tenant_id), str(source.id), str(job.id), source.url, max_pages,
                )
                await db.commit()
                triggered.append({"source_id": str(source.id), "url": source.url, "status": "completed"})
            except Exception as exc:
                logger.error("Scheduled recrawl failed for source %s: %s", source.id, exc)
                await db.rollback()
                triggered.append({"source_id": str(source.id), "url": source.url, "status": "failed", "error": str(exc)[:300]})

    return {"checked": len(sources), "due": len(due), "results": triggered}
