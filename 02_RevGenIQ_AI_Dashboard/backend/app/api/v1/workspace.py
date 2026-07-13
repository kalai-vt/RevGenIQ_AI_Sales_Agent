"""Workspace (organization) settings — company profile shown to the AI agent
and used across the dashboard (name, branding, contact emails, locale)."""
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin, require_tenant, AuthContext
from app.core.exceptions import NotFound
from app.db.session import get_db
from app.models.tenant import Tenant

router = APIRouter(prefix="/workspace", tags=["workspace"])


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    website_url: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    timezone: Optional[str] = None
    primary_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    description: Optional[str] = None
    support_email: Optional[EmailStr] = None
    sales_email: Optional[EmailStr] = None
    phone: Optional[str] = None
    logo_url: Optional[str] = None


def _serialize(t: Tenant) -> dict:
    return {
        "id": str(t.id),
        "name": t.name,
        "slug": t.slug,
        "logo_url": t.logo_url,
        "website_url": t.website_url,
        "industry": t.industry,
        "country": t.country,
        "timezone": t.timezone,
        "primary_color": t.primary_color,
        "description": t.description,
        "support_email": t.support_email,
        "sales_email": t.sales_email,
        "phone": t.phone,
        "is_verified": t.is_verified,
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }


async def _get_tenant(tenant_id, db: AsyncSession) -> Tenant:
    tenant = (await db.execute(select(Tenant).where(Tenant.id == tenant_id))).scalar_one_or_none()
    if not tenant:
        raise NotFound("Workspace")
    return tenant


@router.get("")
async def get_workspace(
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    tenant = await _get_tenant(auth.tenant_id, db)
    return _serialize(tenant)


@router.patch("")
async def update_workspace(
    payload: WorkspaceUpdate,
    auth: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    tenant = await _get_tenant(auth.tenant_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(tenant, field, value)
    await db.commit()
    await db.refresh(tenant)
    return _serialize(tenant)
