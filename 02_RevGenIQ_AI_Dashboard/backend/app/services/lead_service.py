import uuid as uuid_lib
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.lead import Lead, LeadStatus, LeadPriority


def _safe_uuid(value) -> Optional[uuid_lib.UUID]:
    if value is None:
        return None
    if isinstance(value, uuid_lib.UUID):
        return value
    try:
        return uuid_lib.UUID(str(value))
    except (ValueError, AttributeError):
        return None


class LeadService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_or_update_lead(self, tenant_id: str, conversation_id: str, lead_data: dict) -> Lead:
        tid = _safe_uuid(tenant_id)
        cid = _safe_uuid(conversation_id)

        # Check for existing lead by conversation_id (chat-captured leads)
        existing = None
        if cid:
            result = await self.db.execute(
                select(Lead).where(Lead.tenant_id == tid, Lead.conversation_id == cid)
            )
            existing = result.scalar_one_or_none()

        # Fall back to email match within the same tenant
        if not existing and lead_data.get("email"):
            result = await self.db.execute(
                select(Lead).where(Lead.tenant_id == tid, Lead.email == lead_data["email"])
            )
            existing = result.scalar_one_or_none()

        if existing:
            if lead_data.get("name"):
                existing.name = lead_data["name"]
            if lead_data.get("email"):
                existing.email = lead_data["email"]
            if lead_data.get("phone"):
                existing.phone = lead_data["phone"]
            if lead_data.get("company_name"):
                existing.company_name = lead_data["company_name"]
            if lead_data.get("country"):
                existing.country = lead_data["country"]
            if lead_data.get("requirement"):
                existing.requirement = lead_data["requirement"]
            if lead_data.get("quantity"):
                existing.quantity = lead_data["quantity"]
            await self.db.flush()
            return existing

        lead = Lead(
            tenant_id=tid,
            conversation_id=cid,
            name=lead_data.get("name", "Unknown"),
            email=lead_data.get("email", ""),
            phone=lead_data.get("phone"),
            company_name=lead_data.get("company_name"),
            country=lead_data.get("country"),
            requirement=lead_data.get("requirement"),
            quantity=lead_data.get("quantity"),
            source="chat",
            status=LeadStatus.new,
            priority=LeadPriority.medium,
        )
        self.db.add(lead)
        await self.db.flush()
        return lead

    async def get_leads(self, tenant_id: str, filters: dict, skip: int = 0, limit: int = 50):
        tid = _safe_uuid(tenant_id)
        query = select(Lead).where(Lead.tenant_id == tid)
        if filters.get("status"):
            query = query.where(Lead.status == LeadStatus(filters["status"]))
        if filters.get("priority"):
            query = query.where(Lead.priority == LeadPriority(filters["priority"]))
        if filters.get("country"):
            query = query.where(Lead.country == filters["country"])
        query = query.order_by(Lead.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_lead_stats(self, tenant_id: str) -> dict:
        tid = _safe_uuid(tenant_id)
        total = (await self.db.execute(
            select(func.count(Lead.id)).where(Lead.tenant_id == tid)
        )).scalar() or 0

        high = (await self.db.execute(
            select(func.count(Lead.id)).where(Lead.tenant_id == tid, Lead.priority == LeadPriority.high)
        )).scalar() or 0

        avg_score = (await self.db.execute(
            select(func.avg(Lead.lead_score)).where(Lead.tenant_id == tid)
        )).scalar() or 0.0

        return {"total": total, "high_priority": high, "avg_score": float(avg_score)}
