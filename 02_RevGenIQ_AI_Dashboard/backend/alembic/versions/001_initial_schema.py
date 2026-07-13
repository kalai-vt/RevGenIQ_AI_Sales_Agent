"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-26 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ── Enum types ────────────────────────────────────────────────────────────────

userrole_enum             = sa.Enum("owner", "admin", "sales", "support", "viewer",          name="userrole")
sourcetype_enum           = sa.Enum("website", "pdf", "docx", "txt", "faq", "manual",        name="sourcetype")
sourcestatus_enum         = sa.Enum("pending", "processing", "ready", "failed",              name="sourcestatus")
crawlfrequency_enum       = sa.Enum("never", "daily", "weekly", "monthly",                   name="crawlfrequency")
conversationstatus_enum   = sa.Enum("active", "closed", "archived",                          name="conversationstatus")
messagerole_enum          = sa.Enum("user", "assistant", "system",                           name="messagerole")
leadstatus_enum           = sa.Enum("new", "contacted", "qualified", "converted", "lost",    name="leadstatus")
leadpriority_enum         = sa.Enum("low", "medium", "high",                                 name="leadpriority")
subscriptionstatus_enum   = sa.Enum("trialing", "active", "past_due", "canceled", "unpaid",  name="subscriptionstatus")
billingcycle_enum         = sa.Enum("monthly", "yearly",                                     name="billingcycle")


def upgrade() -> None:
    # ── Enums ─────────────────────────────────────────────────────────────────
    userrole_enum.create(op.get_bind(), checkfirst=True)
    sourcetype_enum.create(op.get_bind(), checkfirst=True)
    sourcestatus_enum.create(op.get_bind(), checkfirst=True)
    crawlfrequency_enum.create(op.get_bind(), checkfirst=True)
    conversationstatus_enum.create(op.get_bind(), checkfirst=True)
    messagerole_enum.create(op.get_bind(), checkfirst=True)
    leadstatus_enum.create(op.get_bind(), checkfirst=True)
    leadpriority_enum.create(op.get_bind(), checkfirst=True)
    subscriptionstatus_enum.create(op.get_bind(), checkfirst=True)
    billingcycle_enum.create(op.get_bind(), checkfirst=True)

    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id",                 postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email",              sa.String(255), nullable=False),
        sa.Column("hashed_password",    sa.String(255)),
        sa.Column("full_name",          sa.String(255)),
        sa.Column("avatar_url",         sa.String(500)),
        sa.Column("is_active",          sa.Boolean,  server_default="true",  nullable=False),
        sa.Column("is_superadmin",      sa.Boolean,  server_default="false", nullable=False),
        sa.Column("is_verified",        sa.Boolean,  server_default="false", nullable=False),
        sa.Column("email_verified_at",  sa.DateTime(timezone=True)),
        sa.Column("last_login_at",      sa.DateTime(timezone=True)),
        sa.Column("login_provider",     sa.String(50), server_default="email", nullable=False),
        sa.Column("provider_id",        sa.String(255)),
        sa.Column("created_at",         sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",         sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── tenants ───────────────────────────────────────────────────────────────
    op.create_table(
        "tenants",
        sa.Column("id",             postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name",           sa.String(255), nullable=False),
        sa.Column("slug",           sa.String(100), nullable=False),
        sa.Column("logo_url",       sa.String(500)),
        sa.Column("website_url",    sa.String(500)),
        sa.Column("industry",       sa.String(100)),
        sa.Column("country",        sa.String(100)),
        sa.Column("timezone",       sa.String(50),  server_default="UTC",      nullable=False),
        sa.Column("primary_color",  sa.String(7),   server_default="#10B981",  nullable=False),
        sa.Column("description",    sa.Text),
        sa.Column("support_email",  sa.String(255)),
        sa.Column("sales_email",    sa.String(255)),
        sa.Column("phone",          sa.String(50)),
        sa.Column("is_active",      sa.Boolean, server_default="true",  nullable=False),
        sa.Column("is_verified",    sa.Boolean, server_default="false", nullable=False),
        sa.Column("deleted_at",     sa.DateTime(timezone=True)),
        sa.Column("created_at",     sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",     sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_tenants_slug", "tenants", ["slug"], unique=True)

    # ── tenant_memberships ────────────────────────────────────────────────────
    op.create_table(
        "tenant_memberships",
        sa.Column("id",          postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",   postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id",     postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id",   ondelete="CASCADE"), nullable=False),
        sa.Column("role",        userrole_enum, server_default="viewer", nullable=False),
        sa.Column("is_active",   sa.Boolean, server_default="true", nullable=False),
        sa.Column("invited_by",  postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("joined_at",   sa.DateTime(timezone=True)),
        sa.Column("created_at",  sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",  sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("tenant_id", "user_id"),
    )
    op.create_index("ix_tenant_memberships_tenant_id", "tenant_memberships", ["tenant_id"])
    op.create_index("ix_tenant_memberships_user_id",   "tenant_memberships", ["user_id"])

    # ── invitations ───────────────────────────────────────────────────────────
    op.create_table(
        "invitations",
        sa.Column("id",          postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",   postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email",       sa.String(255), nullable=False),
        sa.Column("role",        sa.String(50),  server_default="viewer"),
        sa.Column("token",       sa.String(255), nullable=False),
        sa.Column("invited_by",  postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("expires_at",  sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True)),
        sa.Column("created_at",  sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",  sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_invitations_token", "invitations", ["token"], unique=True)

    # ── plans ─────────────────────────────────────────────────────────────────
    op.create_table(
        "plans",
        sa.Column("id",                     postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name",                   sa.String(100), nullable=False),
        sa.Column("slug",                   sa.String(50),  nullable=False),
        sa.Column("description",            sa.Text),
        sa.Column("price_monthly",          sa.Numeric(10, 2), server_default="0"),
        sa.Column("price_yearly",           sa.Numeric(10, 2), server_default="0"),
        sa.Column("max_conversations",      sa.Integer, server_default="1000"),
        sa.Column("max_leads",              sa.Integer, server_default="500"),
        sa.Column("max_users",              sa.Integer, server_default="3"),
        sa.Column("max_knowledge_mb",       sa.Integer, server_default="50"),
        sa.Column("max_websites",           sa.Integer, server_default="1"),
        sa.Column("features",               postgresql.JSONB, server_default="{}"),
        sa.Column("stripe_monthly_price_id",sa.String(255)),
        sa.Column("stripe_yearly_price_id", sa.String(255)),
        sa.Column("is_active",              sa.Boolean, server_default="true"),
        sa.Column("is_public",              sa.Boolean, server_default="true"),
        sa.Column("sort_order",             sa.Integer, server_default="0"),
        sa.Column("created_at",             sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",             sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_plans_slug", "plans", ["slug"], unique=True)

    # ── subscriptions ─────────────────────────────────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id",                     postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",              postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id",                postgresql.UUID(as_uuid=True), sa.ForeignKey("plans.id"), nullable=False),
        sa.Column("status",                 subscriptionstatus_enum, server_default="trialing", nullable=False),
        sa.Column("billing_cycle",          billingcycle_enum, server_default="monthly", nullable=False),
        sa.Column("current_period_start",   sa.DateTime(timezone=True)),
        sa.Column("current_period_end",     sa.DateTime(timezone=True)),
        sa.Column("trial_ends_at",          sa.DateTime(timezone=True)),
        sa.Column("canceled_at",            sa.DateTime(timezone=True)),
        sa.Column("stripe_customer_id",     sa.String(255)),
        sa.Column("stripe_subscription_id", sa.String(255)),
        sa.Column("created_at",             sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",             sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("tenant_id"),
    )

    # ── invoices ──────────────────────────────────────────────────────────────
    op.create_table(
        "invoices",
        sa.Column("id",               postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",        postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("stripe_invoice_id",sa.String(255)),
        sa.Column("amount",           sa.Numeric(10, 2), nullable=False),
        sa.Column("currency",         sa.String(3), server_default="USD"),
        sa.Column("status",           sa.String(50), server_default="draft"),
        sa.Column("invoice_url",      sa.String(500)),
        sa.Column("paid_at",          sa.DateTime(timezone=True)),
        sa.Column("period_start",     sa.DateTime(timezone=True)),
        sa.Column("period_end",       sa.DateTime(timezone=True)),
        sa.Column("created_at",       sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",       sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_invoices_tenant_id", "invoices", ["tenant_id"])

    # ── widget_configs ────────────────────────────────────────────────────────
    op.create_table(
        "widget_configs",
        sa.Column("id",                 postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",          postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("widget_key",         postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("agent_name",         sa.String(100), server_default="AI Assistant"),
        sa.Column("welcome_message",    sa.Text),
        sa.Column("placeholder_text",   sa.String(255), server_default="Type a message..."),
        sa.Column("primary_color",      sa.String(7),   server_default="#10B981"),
        sa.Column("secondary_color",    sa.String(7),   server_default="#F0FDF4"),
        sa.Column("text_color",         sa.String(7),   server_default="#111827"),
        sa.Column("position",           sa.String(20),  server_default="bottom-right"),
        sa.Column("logo_url",           sa.String(500)),
        sa.Column("avatar_url",         sa.String(500)),
        sa.Column("language",           sa.String(10),  server_default="en"),
        sa.Column("business_hours",     postgresql.JSONB, server_default="{}"),
        sa.Column("suggested_questions",postgresql.JSONB, server_default="[]"),
        sa.Column("allowed_domains",    postgresql.JSONB, server_default="[]"),
        sa.Column("is_active",          sa.Boolean, server_default="true"),
        sa.Column("show_branding",      sa.Boolean, server_default="true"),
        sa.Column("enable_file_upload", sa.Boolean, server_default="false"),
        sa.Column("enable_voice",       sa.Boolean, server_default="false"),
        sa.Column("enable_emoji",       sa.Boolean, server_default="true"),
        sa.Column("created_at",         sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",         sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_widget_configs_tenant_id",  "widget_configs", ["tenant_id"])
    op.create_index("ix_widget_configs_widget_key", "widget_configs", ["widget_key"], unique=True)

    # ── ai_configs ────────────────────────────────────────────────────────────
    op.create_table(
        "ai_configs",
        sa.Column("id",                         postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",                  postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("llm_model",                  sa.String(100), server_default="gpt-4o-mini"),
        sa.Column("temperature",                sa.Numeric(3, 2), server_default="0.4"),
        sa.Column("max_tokens",                 sa.Integer, server_default="800"),
        sa.Column("system_prompt",              sa.Text),
        sa.Column("fallback_message",           sa.Text),
        sa.Column("enable_lead_capture",        sa.Boolean, server_default="true"),
        sa.Column("lead_capture_after_messages",sa.Integer, server_default="2"),
        sa.Column("escalation_enabled",         sa.Boolean, server_default="false"),
        sa.Column("escalation_email",           sa.String(255)),
        sa.Column("rag_top_k",                  sa.Integer, server_default="5"),
        sa.Column("enable_memory",              sa.Boolean, server_default="true"),
        sa.Column("memory_window",              sa.Integer, server_default="10"),
        sa.Column("created_at",                 sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",                 sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_ai_configs_tenant_id", "ai_configs", ["tenant_id"])

    # ── knowledge_sources ─────────────────────────────────────────────────────
    op.create_table(
        "knowledge_sources",
        sa.Column("id",               postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",        postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_type",      sourcetype_enum, nullable=False),
        sa.Column("name",             sa.String(255), nullable=False),
        sa.Column("url",              sa.String(500)),
        sa.Column("file_path",        sa.String(500)),
        sa.Column("file_size",        sa.Integer),
        sa.Column("status",           sourcestatus_enum, server_default="pending"),
        sa.Column("chunk_count",      sa.Integer, server_default="0"),
        sa.Column("error_message",    sa.Text),
        sa.Column("metadata",         postgresql.JSONB, server_default="{}"),
        sa.Column("crawl_frequency",  crawlfrequency_enum, server_default="never"),
        sa.Column("last_crawled_at",  sa.DateTime(timezone=True)),
        sa.Column("created_at",       sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",       sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_knowledge_sources_tenant_id", "knowledge_sources", ["tenant_id"])

    # ── knowledge_chunks ──────────────────────────────────────────────────────
    op.create_table(
        "knowledge_chunks",
        sa.Column("id",           postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_id",    postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_sources.id", ondelete="CASCADE"), nullable=False),
        sa.Column("chunk_text",   sa.Text, nullable=False),
        sa.Column("chunk_index",  sa.Integer, nullable=False),
        sa.Column("token_count",  sa.Integer),
        sa.Column("embedding_id", sa.String(255)),
        sa.Column("metadata",     postgresql.JSONB, server_default="{}"),
        sa.Column("created_at",   sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_knowledge_chunks_tenant_id", "knowledge_chunks", ["tenant_id"])
    op.create_index("ix_knowledge_chunks_source_id", "knowledge_chunks", ["source_id"])

    # ── crawl_jobs ────────────────────────────────────────────────────────────
    op.create_table(
        "crawl_jobs",
        sa.Column("id",            postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",     postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source_id",     postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_sources.id", ondelete="SET NULL")),
        sa.Column("url",           sa.String(500), nullable=False),
        sa.Column("status",        sa.String(50), server_default="pending"),
        sa.Column("pages_crawled", sa.Integer, server_default="0"),
        sa.Column("pages_total",   sa.Integer),
        sa.Column("error_message", sa.Text),
        sa.Column("started_at",    sa.DateTime(timezone=True)),
        sa.Column("completed_at",  sa.DateTime(timezone=True)),
        sa.Column("created_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_crawl_jobs_tenant_id", "crawl_jobs", ["tenant_id"])

    # ── conversations ─────────────────────────────────────────────────────────
    op.create_table(
        "conversations",
        sa.Column("id",              postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",       postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("visitor_id",      sa.String(255), nullable=False),
        sa.Column("session_token",   sa.String(255), nullable=False),
        sa.Column("status",          conversationstatus_enum, server_default="active"),
        sa.Column("channel",         sa.String(50), server_default="widget"),
        sa.Column("page_url",        sa.String(500)),
        sa.Column("country",         sa.String(100)),
        sa.Column("city",            sa.String(100)),
        sa.Column("ip_address",      sa.String(50)),
        sa.Column("language",        sa.String(10)),
        sa.Column("assigned_to",     postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("lead_id",         postgresql.UUID(as_uuid=True)),
        sa.Column("summary",         sa.Text),
        sa.Column("sentiment",       sa.String(20)),
        sa.Column("tags",            postgresql.JSONB, server_default="[]"),
        sa.Column("metadata",        postgresql.JSONB, server_default="{}"),
        sa.Column("last_message_at", sa.DateTime(timezone=True)),
        sa.Column("closed_at",       sa.DateTime(timezone=True)),
        sa.Column("created_at",      sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",      sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_conversations_tenant_id",     "conversations", ["tenant_id"])
    op.create_index("ix_conversations_visitor_id",    "conversations", ["visitor_id"])
    op.create_index("ix_conversations_session_token", "conversations", ["session_token"], unique=True)

    # ── messages ──────────────────────────────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column("id",                  postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",           postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id",     postgresql.UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role",                messagerole_enum, nullable=False),
        sa.Column("content",             sa.Text, nullable=False),
        sa.Column("structured_response", postgresql.JSONB),
        sa.Column("intent",              sa.String(100)),
        sa.Column("confidence",          sa.Numeric(4, 3)),
        sa.Column("lead_score",          sa.Numeric(4, 3)),
        sa.Column("tokens_used",         sa.Integer),
        sa.Column("response_time_ms",    sa.Integer),
        sa.Column("sources",             postgresql.JSONB, server_default="[]"),
        sa.Column("created_at",          sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_messages_tenant_id",       "messages", ["tenant_id"])
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])

    # ── leads ─────────────────────────────────────────────────────────────────
    op.create_table(
        "leads",
        sa.Column("id",                postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",         postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("conversation_id",   postgresql.UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="SET NULL")),
        sa.Column("name",              sa.String(255)),
        sa.Column("email",             sa.String(255)),
        sa.Column("phone",             sa.String(100)),
        sa.Column("company_name",      sa.String(255)),
        sa.Column("job_title",         sa.String(255)),
        sa.Column("country",           sa.String(100)),
        sa.Column("city",              sa.String(100)),
        sa.Column("website",           sa.String(255)),
        sa.Column("requirement",       sa.Text),
        sa.Column("quantity",          sa.String(100)),
        sa.Column("budget",            sa.String(100)),
        sa.Column("source",            sa.String(100), server_default="chat"),
        sa.Column("status",            leadstatus_enum,   server_default="new"),
        sa.Column("priority",          leadpriority_enum, server_default="medium"),
        sa.Column("lead_score",        sa.Numeric(5, 2), server_default="0.0"),
        sa.Column("assigned_to",       postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("tags",              postgresql.JSONB, server_default="[]"),
        sa.Column("custom_fields",     postgresql.JSONB, server_default="{}"),
        sa.Column("last_contacted_at", sa.DateTime(timezone=True)),
        sa.Column("created_at",        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at",        sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_leads_tenant_id", "leads", ["tenant_id"])
    op.create_index("ix_leads_email",     "leads", ["email"])
    op.create_index("ix_leads_status",    "leads", ["status"])

    # ── lead_activities ───────────────────────────────────────────────────────
    op.create_table(
        "lead_activities",
        sa.Column("id",            postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",     postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lead_id",       postgresql.UUID(as_uuid=True), sa.ForeignKey("leads.id", ondelete="CASCADE"), nullable=False),
        sa.Column("activity_type", sa.String(100), nullable=False),
        sa.Column("content",       sa.Text),
        sa.Column("metadata",      postgresql.JSONB, server_default="{}"),
        sa.Column("performed_by",  postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
        sa.Column("created_at",    sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_lead_activities_tenant_id", "lead_activities", ["tenant_id"])
    op.create_index("ix_lead_activities_lead_id",   "lead_activities", ["lead_id"])

    # ── analytics_events ──────────────────────────────────────────────────────
    op.create_table(
        "analytics_events",
        sa.Column("id",              postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",       postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type",      sa.String(100), nullable=False),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True)),
        sa.Column("visitor_id",      sa.String(255)),
        sa.Column("country",         sa.String(100)),
        sa.Column("page_url",        sa.String(500)),
        sa.Column("metadata",        postgresql.JSONB, server_default="{}"),
        sa.Column("created_at",      sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_analytics_events_tenant_id",  "analytics_events", ["tenant_id"])
    op.create_index("ix_analytics_events_event_type", "analytics_events", ["event_type"])
    op.create_index("ix_analytics_events_created_at", "analytics_events", ["created_at"])

    # ── analytics_daily ───────────────────────────────────────────────────────
    op.create_table(
        "analytics_daily",
        sa.Column("id",              postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",       postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("date",            sa.Date, nullable=False),
        sa.Column("visitors",        sa.Integer, server_default="0"),
        sa.Column("conversations",   sa.Integer, server_default="0"),
        sa.Column("messages",        sa.Integer, server_default="0"),
        sa.Column("leads",           sa.Integer, server_default="0"),
        sa.Column("conversions",     sa.Integer, server_default="0"),
        sa.Column("avg_response_ms", sa.Integer),
        sa.Column("tokens_used",     sa.Integer, server_default="0"),
        sa.Column("top_intents",     postgresql.JSONB, server_default="[]"),
        sa.UniqueConstraint("tenant_id", "date"),
    )
    op.create_index("ix_analytics_daily_tenant_id", "analytics_daily", ["tenant_id"])
    op.create_index("ix_analytics_daily_date",      "analytics_daily", ["date"])

    # ── audit_logs ────────────────────────────────────────────────────────────
    op.create_table(
        "audit_logs",
        sa.Column("id",            postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id",     postgresql.UUID(as_uuid=True)),
        sa.Column("user_id",       postgresql.UUID(as_uuid=True)),
        sa.Column("action",        sa.String(255), nullable=False),
        sa.Column("resource_type", sa.String(100)),
        sa.Column("resource_id",   sa.String(255)),
        sa.Column("changes",       postgresql.JSONB),
        sa.Column("ip_address",    sa.String(50)),
        sa.Column("created_at",    sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_audit_logs_tenant_id",  "audit_logs", ["tenant_id"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("analytics_daily")
    op.drop_table("analytics_events")
    op.drop_table("lead_activities")
    op.drop_table("leads")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("crawl_jobs")
    op.drop_table("knowledge_chunks")
    op.drop_table("knowledge_sources")
    op.drop_table("ai_configs")
    op.drop_table("widget_configs")
    op.drop_table("invoices")
    op.drop_table("subscriptions")
    op.drop_table("plans")
    op.drop_table("invitations")
    op.drop_table("tenant_memberships")
    op.drop_table("tenants")
    op.drop_table("users")

    billingcycle_enum.drop(op.get_bind(), checkfirst=True)
    subscriptionstatus_enum.drop(op.get_bind(), checkfirst=True)
    leadpriority_enum.drop(op.get_bind(), checkfirst=True)
    leadstatus_enum.drop(op.get_bind(), checkfirst=True)
    messagerole_enum.drop(op.get_bind(), checkfirst=True)
    conversationstatus_enum.drop(op.get_bind(), checkfirst=True)
    crawlfrequency_enum.drop(op.get_bind(), checkfirst=True)
    sourcestatus_enum.drop(op.get_bind(), checkfirst=True)
    sourcetype_enum.drop(op.get_bind(), checkfirst=True)
    userrole_enum.drop(op.get_bind(), checkfirst=True)
