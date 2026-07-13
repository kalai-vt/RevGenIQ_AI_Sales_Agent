import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, TenantMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.tenant import Tenant


class WidgetConfig(Base, UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin):
    __tablename__ = "widget_configs"

    widget_key: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4, index=True
    )
    agent_name: Mapped[str] = mapped_column(String(100), default="AI Assistant")
    welcome_message: Mapped[Optional[str]] = mapped_column(Text)
    placeholder_text: Mapped[str] = mapped_column(String(255), default="Type a message...")
    primary_color: Mapped[str] = mapped_column(String(7), default="#10B981")
    secondary_color: Mapped[str] = mapped_column(String(7), default="#F0FDF4")
    text_color: Mapped[str] = mapped_column(String(7), default="#111827")
    position: Mapped[str] = mapped_column(String(20), default="bottom-right")
    logo_url: Mapped[Optional[str]] = mapped_column(String(500))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    language: Mapped[str] = mapped_column(String(10), default="en")
    business_hours: Mapped[dict] = mapped_column(JSON, default=dict)
    suggested_questions: Mapped[list] = mapped_column(JSON, default=list)
    allowed_domains: Mapped[list] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    show_branding: Mapped[bool] = mapped_column(Boolean, default=True)
    enable_file_upload: Mapped[bool] = mapped_column(Boolean, default=False)
    enable_voice: Mapped[bool] = mapped_column(Boolean, default=False)
    enable_emoji: Mapped[bool] = mapped_column(Boolean, default=True)

    tenant: Mapped["Tenant"] = relationship(back_populates="widget_config")


class AIConfig(Base, UUIDPrimaryKeyMixin, TenantMixin, TimestampMixin):
    __tablename__ = "ai_configs"

    llm_model: Mapped[str] = mapped_column(String(100), default="gpt-4o-mini")
    temperature: Mapped[float] = mapped_column(Numeric(3, 2), default=0.4)
    max_tokens: Mapped[int] = mapped_column(Integer, default=800)
    system_prompt: Mapped[Optional[str]] = mapped_column(Text)
    fallback_message: Mapped[Optional[str]] = mapped_column(Text)
    enable_lead_capture: Mapped[bool] = mapped_column(Boolean, default=True)
    lead_capture_after_messages: Mapped[int] = mapped_column(Integer, default=2)
    escalation_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    escalation_email: Mapped[Optional[str]] = mapped_column(String(255))
    rag_top_k: Mapped[int] = mapped_column(Integer, default=5)
    enable_memory: Mapped[bool] = mapped_column(Boolean, default=True)
    memory_window: Mapped[int] = mapped_column(Integer, default=10)
