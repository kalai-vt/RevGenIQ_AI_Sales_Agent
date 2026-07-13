"""Billing API — plans, subscription, invoices.

Read/cancel operations only. Stripe checkout/upgrade requires a live
STRIPE_SECRET_KEY and webhook wiring, which is out of scope without real
credentials — see app/core/config.py `STRIPE_SECRET_KEY`.
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_owner, require_tenant, AuthContext
from app.core.exceptions import NotFound
from app.db.session import get_db
from app.models.billing import Invoice, Plan, Subscription, SubscriptionStatus

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/plans")
async def list_plans(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Plan).where(Plan.is_active == True, Plan.is_public == True).order_by(Plan.sort_order)
    )
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "slug": p.slug,
            "description": p.description,
            "price_monthly": float(p.price_monthly),
            "price_yearly": float(p.price_yearly),
            "max_conversations": p.max_conversations,
            "max_leads": p.max_leads,
            "max_users": p.max_users,
            "max_knowledge_mb": p.max_knowledge_mb,
            "features": p.features,
        }
        for p in result.scalars().all()
    ]


@router.get("/subscription")
async def get_subscription(
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription).where(Subscription.tenant_id == auth.tenant_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise NotFound("Subscription")

    plan_result = await db.execute(select(Plan).where(Plan.id == sub.plan_id))
    plan = plan_result.scalar_one_or_none()

    return {
        "id": str(sub.id),
        "status": sub.status.value,
        "billing_cycle": sub.billing_cycle.value,
        "current_period_start": sub.current_period_start.isoformat() if sub.current_period_start else None,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else None,
        "trial_ends_at": sub.trial_ends_at.isoformat() if sub.trial_ends_at else None,
        "canceled_at": sub.canceled_at.isoformat() if sub.canceled_at else None,
        "plan": {
            "id": str(plan.id),
            "name": plan.name,
            "slug": plan.slug,
            "price_monthly": float(plan.price_monthly),
            "price_yearly": float(plan.price_yearly),
            "features": plan.features,
        } if plan else None,
    }


@router.post("/subscription/cancel")
async def cancel_subscription(
    auth: AuthContext = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription).where(Subscription.tenant_id == auth.tenant_id))
    sub = result.scalar_one_or_none()
    if not sub:
        raise NotFound("Subscription")

    sub.status = SubscriptionStatus.canceled
    sub.canceled_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": sub.status.value, "canceled_at": sub.canceled_at.isoformat()}


@router.get("/invoices")
async def list_invoices(
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice).where(Invoice.tenant_id == auth.tenant_id).order_by(Invoice.created_at.desc())
    )
    return [
        {
            "id": str(i.id),
            "amount": float(i.amount),
            "currency": i.currency,
            "status": i.status,
            "invoice_url": i.invoice_url,
            "paid_at": i.paid_at.isoformat() if i.paid_at else None,
            "period_start": i.period_start.isoformat() if i.period_start else None,
            "period_end": i.period_end.isoformat() if i.period_end else None,
            "created_at": i.created_at.isoformat() if i.created_at else None,
        }
        for i in result.scalars().all()
    ]
