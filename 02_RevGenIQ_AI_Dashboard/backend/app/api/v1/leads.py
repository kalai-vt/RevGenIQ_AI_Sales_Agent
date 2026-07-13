"""Leads API — tenant-scoped lead management."""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import assert_tenant_member, require_admin, require_sales, require_tenant, AuthContext
from app.core.exceptions import NotFound
from app.db.session import get_db
from app.models.lead import Lead, LeadActivity, LeadPriority, LeadStatus
from app.services.lead_service import LeadService

router = APIRouter(prefix="/leads", tags=["leads"])


class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    priority: Optional[LeadPriority] = None
    assigned_to: Optional[UUID] = None
    tags: Optional[list[str]] = None


class ActivityCreate(BaseModel):
    activity_type: str
    content: Optional[str] = None


def _serialize_lead(lead: Lead) -> dict:
    return {
        "id": str(lead.id),
        "conversation_id": str(lead.conversation_id) if lead.conversation_id else None,
        "name": lead.name,
        "email": lead.email,
        "phone": lead.phone,
        "company_name": lead.company_name,
        "job_title": lead.job_title,
        "country": lead.country,
        "city": lead.city,
        "website": lead.website,
        "requirement": lead.requirement,
        "quantity": lead.quantity,
        "budget": lead.budget,
        "source": lead.source,
        "status": lead.status.value,
        "priority": lead.priority.value,
        "lead_score": float(lead.lead_score),
        "assigned_to": str(lead.assigned_to) if lead.assigned_to else None,
        "tags": lead.tags,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
        "last_contacted_at": lead.last_contacted_at.isoformat() if lead.last_contacted_at else None,
    }


@router.get("")
async def list_leads(
    status: Optional[LeadStatus] = None,
    priority: Optional[LeadPriority] = None,
    country: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    service = LeadService(db)
    filters = {
        "status": status.value if status else None,
        "priority": priority.value if priority else None,
        "country": country,
    }
    leads = await service.get_leads(str(auth.tenant_id), filters, skip, limit)
    return [_serialize_lead(lead) for lead in leads]


@router.get("/stats")
async def lead_stats(
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    service = LeadService(db)
    return await service.get_lead_stats(str(auth.tenant_id))


@router.get("/{lead_id}")
async def get_lead(
    lead_id: UUID,
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id, Lead.tenant_id == auth.tenant_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise NotFound("Lead")
    return _serialize_lead(lead)


@router.patch("/{lead_id}")
async def update_lead(
    lead_id: UUID,
    payload: LeadUpdate,
    auth: AuthContext = Depends(require_sales),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id, Lead.tenant_id == auth.tenant_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise NotFound("Lead")
    if payload.status is not None:
        lead.status = payload.status
    if payload.priority is not None:
        lead.priority = payload.priority
    if payload.assigned_to is not None:
        await assert_tenant_member(db, auth.tenant_id, payload.assigned_to)
        lead.assigned_to = payload.assigned_to
    if payload.tags is not None:
        lead.tags = payload.tags
    await db.commit()
    await db.refresh(lead)
    return _serialize_lead(lead)


@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: UUID,
    auth: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id, Lead.tenant_id == auth.tenant_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise NotFound("Lead")
    await db.delete(lead)
    await db.commit()


@router.get("/{lead_id}/activities")
async def list_activities(
    lead_id: UUID,
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(LeadActivity)
        .where(LeadActivity.lead_id == lead_id, LeadActivity.tenant_id == auth.tenant_id)
        .order_by(LeadActivity.created_at.desc())
    )
    return [
        {
            "id": str(a.id),
            "activity_type": a.activity_type,
            "content": a.content,
            "performed_by": str(a.performed_by) if a.performed_by else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in result.scalars().all()
    ]


@router.post("/{lead_id}/activities", status_code=201)
async def create_activity(
    lead_id: UUID,
    payload: ActivityCreate,
    auth: AuthContext = Depends(require_sales),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lead).where(Lead.id == lead_id, Lead.tenant_id == auth.tenant_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise NotFound("Lead")

    now = datetime.now(timezone.utc)
    activity = LeadActivity(
        tenant_id=auth.tenant_id,
        lead_id=lead_id,
        activity_type=payload.activity_type,
        content=payload.content,
        performed_by=auth.user.id,
        created_at=now,
    )
    db.add(activity)
    lead.last_contacted_at = now
    await db.commit()
    return {
        "id": str(activity.id),
        "activity_type": activity.activity_type,
        "content": activity.content,
        "created_at": now.isoformat(),
    }
