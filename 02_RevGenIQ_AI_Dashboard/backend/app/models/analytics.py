import uuid
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TenantMixin, UUIDPrimaryKeyMixin


class AnalyticsEvent(Base, UUIDPrimaryKeyMixin, TenantMixin):
    """Raw events — partitioned by created_at in production."""
    __tablename__ = "analytics_events"

    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    conversation_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True))
    visitor_id: Mapped[Optional[str]] = mapped_column(String(255))
    country: Mapped[Optional[str]] = mapped_column(String(100))
    page_url: Mapped[Optional[str]] = mapped_column(String(500))
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)


class AnalyticsDaily(Base, UUIDPrimaryKeyMixin, TenantMixin):
    """Pre-aggregated daily summaries for fast dashboard queries."""
    __tablename__ = "analytics_daily"
    __table_args__ = (UniqueConstraint("tenant_id", "date"),)

    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    visitors: Mapped[int] = mapped_column(Integer, default=0)
    conversations: Mapped[int] = mapped_column(Integer, default=0)
    messages: Mapped[int] = mapped_column(Integer, default=0)
    leads: Mapped[int] = mapped_column(Integer, default=0)
    conversions: Mapped[int] = mapped_column(Integer, default=0)
    avg_response_ms: Mapped[Optional[int]] = mapped_column(Integer)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    top_intents: Mapped[list] = mapped_column(JSON, default=list)


class AuditLog(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "audit_logs"

    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True), index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid(as_uuid=True))
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    resource_type: Mapped[Optional[str]] = mapped_column(String(100))
    resource_id: Mapped[Optional[str]] = mapped_column(String(255))
    changes: Mapped[Optional[dict]] = mapped_column(JSON)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
