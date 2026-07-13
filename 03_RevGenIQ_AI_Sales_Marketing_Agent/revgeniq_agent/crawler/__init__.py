import hashlib
import logging
import re
import uuid as uuid_lib
from datetime import datetime, timezone
from typing import List, Optional, Set
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select

from app.models.knowledge import KnowledgeSource, SourceStatus, SourceType, CrawlJob, WebsitePage, PageCrawlStatus, KnowledgeChunk
from app.core.config import settings

logger = logging.getLogger(__name__)

_SITEMAP_LOC_RE = re.compile(r"<loc>\s*([^<\s]+)\s*</loc>", re.IGNORECASE)
_MIN_READABLE_CHARS = 40  # below this, treat the page as JS-rendered/empty rather than "crawled successfully"


def _normalize_url(url: str) -> str:
    """Canonical form for dedup — same page reached via different query
    strings or a trailing slash should count as one page, not two."""
    parsed = urlparse(url)
    path = parsed.path.rstrip("/") or "/"
    return f"{parsed.scheme}://{parsed.netloc}{path}"


class CrawlerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Discovery ─────────────────────────────────────────────────────────────

    async def _discover_via_sitemap(self, client: httpx.AsyncClient, base_url: str, base_domain: str) -> List[str]:
        for sitemap_path in ("/sitemap.xml", "/sitemap_index.xml"):
            try:
                resp = await client.get(urljoin(base_url, sitemap_path))
                if resp.status_code != 200 or "xml" not in resp.headers.get("content-type", "") and "<loc>" not in resp.text:
                    continue
                urls = [u for u in _SITEMAP_LOC_RE.findall(resp.text) if urlparse(u).netloc == base_domain]
                if urls:
                    return urls
            except Exception:
                continue
        return []

    # ── Main crawl ────────────────────────────────────────────────────────────

    async def crawl_website(
        self,
        tenant_id: str,
        source_id: str,
        job_id: str,
        start_url: str,
        max_pages: int = 50,
    ) -> dict:
        job_result = await self.db.execute(select(CrawlJob).where(CrawlJob.id == uuid_lib.UUID(job_id)))
        job = job_result.scalar_one_or_none()

        source_result = await self.db.execute(select(KnowledgeSource).where(KnowledgeSource.id == uuid_lib.UUID(source_id)))
        source = source_result.scalar_one_or_none()

        if job:
            job.status = "running"
            job.started_at = datetime.now(timezone.utc)
            await self.db.flush()

        parsed_start = urlparse(start_url)
        base_domain = parsed_start.netloc
        start_norm = _normalize_url(start_url)

        visited: Set[str] = set()
        pages_crawled = 0
        pages_failed = 0
        chunks_created = 0
        fatal_error: Optional[str] = None

        from revgeniq_agent.embeddings import EmbeddingService
        embedding_svc = EmbeddingService(self.db)

        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers={"User-Agent": "RevGenIQ-AI-KnowledgeBot/1.0"}) as client:
                sitemap_urls = await self._discover_via_sitemap(client, start_url, base_domain)
                queue: List[str] = sitemap_urls[:max_pages] if sitemap_urls else [start_url]
                if start_norm not in {_normalize_url(u) for u in queue}:
                    queue.insert(0, start_url)

                while queue and pages_crawled + pages_failed < max_pages:
                    url = queue.pop(0)
                    norm = _normalize_url(url)
                    if norm in visited:
                        continue
                    visited.add(norm)

                    try:
                        response = await client.get(url)
                        if response.status_code != 200 or "text/html" not in response.headers.get("content-type", ""):
                            continue

                        soup = BeautifulSoup(response.text, "html.parser")
                        title = (soup.title.string or "").strip() if soup.title and soup.title.string else url

                        # Discover links from the PRISTINE soup — nav/footer
                        # sections are exactly where most site structure
                        # (About, Pricing, Contact, etc.) lives, so this must
                        # run before any tags are stripped for content
                        # extraction below, not after.
                        if not sitemap_urls:
                            for a_tag in soup.find_all("a", href=True):
                                full_url = urljoin(url, a_tag["href"])
                                parsed = urlparse(full_url)
                                if parsed.scheme not in ("http", "https") or parsed.netloc != base_domain:
                                    continue
                                clean = _normalize_url(full_url)
                                if clean not in visited and full_url not in queue:
                                    queue.append(full_url)

                        content = self._extract_content(soup)
                        page_result = await self._store_page(
                            tenant_id, source_id, url, title, content, embedding_svc,
                        )
                        if page_result["status"] == PageCrawlStatus.failed:
                            pages_failed += 1
                        else:
                            pages_crawled += 1
                            chunks_created += page_result["chunk_count"]

                        if job:
                            job.pages_crawled = pages_crawled
                            await self.db.flush()

                    except Exception as exc:
                        logger.debug("Skipping %s: %s", url, exc)
                        pages_failed += 1
                        continue

            if source:
                source.chunk_count = chunks_created
                source.last_crawled_at = datetime.now(timezone.utc)
                if chunks_created > 0:
                    source.status = SourceStatus.ready
                    source.error_message = (
                        f"{pages_failed} page(s) could not be read (likely JavaScript-rendered content) — "
                        f"see per-page status for details." if pages_failed else None
                    )
                else:
                    source.status = SourceStatus.failed
                    source.error_message = (
                        "No readable content found on any page. This usually means the site renders its "
                        "content with JavaScript, which the crawler can't execute. Add key content manually "
                        "via FAQ or Documents instead."
                    )
                await self.db.flush()

            if job:
                job.status = "completed"
                job.pages_total = len(visited)
                job.completed_at = datetime.now(timezone.utc)
                await self.db.flush()

        except Exception as exc:
            fatal_error = str(exc)[:500]
            logger.error("Crawl failed for %s: %s", start_url, exc)
            if source:
                source.status = SourceStatus.failed
                source.error_message = fatal_error
                await self.db.flush()
            if job:
                job.status = "failed"
                job.error_message = fatal_error
                job.completed_at = datetime.now(timezone.utc)
                await self.db.flush()

        return {
            "pages_crawled": pages_crawled,
            "pages_failed": pages_failed,
            "total_pages": len(visited),
            "chunks_created": chunks_created,
        }

    # ── Per-page storage with change detection ───────────────────────────────

    async def _store_page(
        self, tenant_id: str, source_id: str, url: str, title: str, content: str, embedding_svc,
    ) -> dict:
        tid = uuid_lib.UUID(tenant_id)
        sid = uuid_lib.UUID(source_id)

        existing = (await self.db.execute(
            select(WebsitePage).where(WebsitePage.source_id == sid, WebsitePage.url == url)
        )).scalar_one_or_none()

        if len(content.strip()) < _MIN_READABLE_CHARS:
            if not existing:
                existing = WebsitePage(tenant_id=tid, source_id=sid, url=url, title=title)
                self.db.add(existing)
            existing.status = PageCrawlStatus.failed
            existing.title = title
            existing.error_message = "No readable text found — this page likely requires JavaScript to render its content."
            existing.chunk_count = 0
            existing.last_crawled_at = datetime.now(timezone.utc)
            await self.db.flush()
            return {"status": PageCrawlStatus.failed, "chunk_count": 0}

        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()

        if existing and existing.content_hash == content_hash:
            existing.status = PageCrawlStatus.unchanged
            existing.last_crawled_at = datetime.now(timezone.utc)
            await self.db.flush()
            return {"status": PageCrawlStatus.unchanged, "chunk_count": existing.chunk_count}

        if not existing:
            existing = WebsitePage(tenant_id=tid, source_id=sid, url=url, title=title)
            self.db.add(existing)
            await self.db.flush()
        else:
            # Content changed since the last crawl — drop old chunks for this
            # page before re-embedding, so search never mixes stale + fresh text.
            await self.db.execute(delete(KnowledgeChunk).where(KnowledgeChunk.page_id == existing.id))

        chunks = self._chunk_by_section(content)
        vectors = await embedding_svc.embed_batch(chunks)
        await embedding_svc.store_chunks(
            tenant_id=tenant_id, chunks=chunks, source_id=source_id, vectors=vectors,
            page_id=str(existing.id), page_url=url, page_title=title, source_type="website",
        )

        existing.title = title
        existing.content_hash = content_hash
        existing.status = PageCrawlStatus.crawled
        existing.chunk_count = len(chunks)
        existing.error_message = None
        existing.last_crawled_at = datetime.now(timezone.utc)
        await self.db.flush()

        return {"status": PageCrawlStatus.crawled, "chunk_count": len(chunks)}

    # ── Content extraction ────────────────────────────────────────────────────

    # Marks a heading line during extraction so chunking can split on real
    # section boundaries instead of guessing from plain text afterward.
    _HEADING_MARK = "\x01H\x01"

    def _extract_content(self, soup: BeautifulSoup) -> str:
        for tag in soup.find_all(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            tag.decompose()

        main = soup.find("main") or soup.find("article") or soup.find("div", class_="content") or soup.find("body")
        if not main:
            main = soup

        # "a" is included so real content that happens to be a link — an
        # email/phone mailto/tel, a "learn more" CTA — isn't silently dropped.
        # nav/footer (the usual source of noisy link lists) are already gone
        # by this point, so remaining links in the content area are the
        # genuine, in-body kind. A seen-text guard stops the obvious
        # double-count when a <p> or <li> wraps an <a> — both would otherwise
        # match and contribute the same text twice.
        seen = set()
        content_parts = []
        for tag in main.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "td", "th", "a"]):
            text = tag.get_text(separator=" ", strip=True)
            if text and len(text) > 10 and text not in seen:
                seen.add(text)
                prefix = self._HEADING_MARK if tag.name in ("h1", "h2", "h3", "h4", "h5", "h6") else ""
                content_parts.append(prefix + text)

        return "\n".join(content_parts)

    # ── Section-aware chunking ────────────────────────────────────────────────

    def _chunk_by_section(self, content: str) -> list[str]:
        """Groups content under its heading rather than splitting at a fixed
        character count — a pricing table and an FAQ answer end up in
        different chunks even if the combined text is short, and a long
        section still gets safely sub-split."""
        lines = [l for l in content.split("\n") if l.strip()]
        if not lines:
            return []

        max_size = settings.MAX_CHUNK_SIZE
        sections: list[str] = []
        current: list[str] = []

        for line in lines:
            is_heading = line.startswith(self._HEADING_MARK)
            if is_heading and current:
                sections.append("\n".join(current))
                current = [line[len(self._HEADING_MARK):]]
            else:
                current.append(line[len(self._HEADING_MARK):] if is_heading else line)
        if current:
            sections.append("\n".join(current))

        chunks: list[str] = []
        for section in sections:
            section = section.strip()
            if not section:
                continue
            if len(section) <= max_size:
                chunks.append(section)
            else:
                chunks.extend(self._split_long_section(section, max_size, settings.CHUNK_OVERLAP))
        return chunks

    def _split_long_section(self, text: str, max_size: int, overlap: int) -> list[str]:
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
