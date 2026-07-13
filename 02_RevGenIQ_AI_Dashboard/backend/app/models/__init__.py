# Import all models so SQLAlchemy registers them with the metadata
from app.models.tenant import Tenant, Invitation
from app.models.user import User, TenantMembership
from app.models.knowledge import KnowledgeSource, KnowledgeChunk, CrawlJob
from app.models.conversation import Conversation, Message
from app.models.lead import Lead, LeadActivity
from app.models.widget import WidgetConfig, AIConfig
from app.models.billing import Plan, Subscription, Invoice
from app.models.analytics import AnalyticsEvent, AnalyticsDaily, AuditLog

__all__ = [
    "Tenant", "Invitation",
    "User", "TenantMembership",
    "KnowledgeSource", "KnowledgeChunk", "CrawlJob",
    "Conversation", "Message",
    "Lead", "LeadActivity",
    "WidgetConfig", "AIConfig",
    "Plan", "Subscription", "Invoice",
    "AnalyticsEvent", "AnalyticsDaily", "AuditLog",
]
