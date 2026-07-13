import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, TenantMixin, UUIDPrimaryKeyMixin


class SourceType(str, enum.Enum):
    website = "website"
    pdf = "pdf"
    docx = "docx"
    txt = "txt"
    faq = "faq"
    manual = "manual"


class SourceStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class CrawlFrequency(str, enum.Enum):
    never = "never"
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"


class KnowledgeSource(Base, UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin):
    __tablename__ = "knowledge_sources"

    source_type: Mapped[SourceType] = mapped_column(Enum(SourceType), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    url: Mapped[Optional[str]] = mapped_column(String(500))
    file_path: Mapped[Optional[str]] = mapped_column(String(500))
    file_size: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[SourceStatus] = mapped_column(Enum(SourceStatus), default=SourceStatus.pending)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    crawl_frequency: Mapped[CrawlFrequency] = mapped_column(Enum(CrawlFrequency), default=CrawlFrequency.never)
    last_crawled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    chunks: Mapped[list["KnowledgeChunk"]] = relationship(
        back_populates="source", cascade="all, delete-orphan"
    )


class KnowledgeChunk(Base, UUIDPrimaryKeyMixin, TenantMixin):
    __tablename__ = "knowledge_chunks"

    source_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("knowledge_sources.id", ondelete="CASCADE"), nullable=False
    )
    # Denormalized retrieval-time metadata — company_id/website_id are
    # tenant_id/source_id above; this is what rounds the schema out to what
    # a vector-DB payload would carry, but queryable as plain Postgres columns.
    page_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("website_pages.id", ondelete="CASCADE")
    )
    page_url: Mapped[Optional[str]] = mapped_column(String(1000))
    page_title: Mapped[Optional[str]] = mapped_column(String(500))
    source_type: Mapped[Optional[SourceType]] = mapped_column(Enum(SourceType))
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    token_count: Mapped[Optional[int]] = mapped_column(Integer)
    embedding_id: Mapped[Optional[str]] = mapped_column(String(255))
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    source: Mapped["KnowledgeSource"] = relationship(back_populates="chunks")


class PageCrawlStatus(str, enum.Enum):
    pending = "pending"
    crawled = "crawled"
    unchanged = "unchanged"
    failed = "failed"


class WebsitePage(Base, UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin):
    """One row per discovered URL for a website KnowledgeSource — the
    per-page crawl status/history the dashboard shows, and the basis for
    change detection (content_hash) on re-crawls."""
    __tablename__ = "website_pages"
    __table_args__ = (UniqueConstraint("source_id", "url", name="uq_website_pages_source_url"),)

    source_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("knowledge_sources.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(500))
    content_hash: Mapped[Optional[str]] = mapped_column(String(64))
    status: Mapped[PageCrawlStatus] = mapped_column(Enum(PageCrawlStatus), default=PageCrawlStatus.pending)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    last_crawled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class CrawlJob(Base, UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin):
    __tablename__ = "crawl_jobs"

    source_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("knowledge_sources.id", ondelete="SET NULL")
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    pages_crawled: Mapped[int] = mapped_column(Integer, default=0)
    pages_total: Mapped[Optional[int]] = mapped_column(Integer)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
