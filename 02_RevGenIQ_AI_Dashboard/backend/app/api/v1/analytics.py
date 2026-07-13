"""Analytics API — tenant-scoped aggregate metrics."""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_tenant, AuthContext
from app.db.session import get_db
from app.models.conversation import Conversation, Message, MessageRole
from app.models.lead import Lead, LeadPriority

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _since(days: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


def _pct(cur: int, prev: int):
    if prev == 0:
        return None
    return round((cur - prev) / prev * 100, 1)


# ── Summary KPIs ──────────────────────────────────────────────────────────────

@router.get("/summary")
async def summary(
    days: int = Query(30, ge=1, le=365),
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    tid = auth.tenant_id
    cutoff = _since(days)
    prev_cutoff = _since(days * 2)

    convs = (await db.execute(
        select(func.count(Conversation.id)).where(
            Conversation.tenant_id == tid, Conversation.created_at >= cutoff)
    )).scalar() or 0

    leads = (await db.execute(
        select(func.count(Lead.id)).where(
            Lead.tenant_id == tid, Lead.created_at >= cutoff)
    )).scalar() or 0

    msgs = (await db.execute(
        select(func.count(Message.id)).join(Conversation, Message.conversation_id == Conversation.id).where(
            Conversation.tenant_id == tid, Message.created_at >= cutoff)
    )).scalar() or 0

    avg_rt = (await db.execute(
        select(func.avg(Message.response_time_ms)).join(Conversation, Message.conversation_id == Conversation.id).where(
            Conversation.tenant_id == tid,
            Message.created_at >= cutoff,
            Message.response_time_ms.isnot(None),
            Message.role == MessageRole.assistant,
        )
    )).scalar() or 0

    prev_convs = (await db.execute(
        select(func.count(Conversation.id)).where(
            Conversation.tenant_id == tid,
            Conversation.created_at >= prev_cutoff,
            Conversation.created_at < cutoff,
        )
    )).scalar() or 0

    prev_leads = (await db.execute(
        select(func.count(Lead.id)).where(
            Lead.tenant_id == tid,
            Lead.created_at >= prev_cutoff,
            Lead.created_at < cutoff,
        )
    )).scalar() or 0

    prev_msgs = (await db.execute(
        select(func.count(Message.id)).join(Conversation, Message.conversation_id == Conversation.id).where(
            Conversation.tenant_id == tid,
            Message.created_at >= prev_cutoff,
            Message.created_at < cutoff,
        )
    )).scalar() or 0

    # Escalation rate: JSON list containment ("escalated" in Conversation.tags) isn't a
    # portable SQL expression across SQLite/Postgres, so this is counted in Python over
    # the period's conversations rather than pushed into the query.
    tag_rows = (await db.execute(
        select(Conversation.tags).where(Conversation.tenant_id == tid, Conversation.created_at >= cutoff)
    )).scalars().all()
    escalated_count = sum(1 for tags in tag_rows if tags and "escalated" in tags)

    avg_confidence = (await db.execute(
        select(func.avg(Message.confidence)).join(Conversation, Message.conversation_id == Conversation.id).where(
            Conversation.tenant_id == tid,
            Message.created_at >= cutoff,
            Message.confidence.isnot(None),
            Message.role == MessageRole.assistant,
        )
    )).scalar() or 0

    high_priority_leads = (await db.execute(
        select(func.count(Lead.id)).where(
            Lead.tenant_id == tid, Lead.created_at >= cutoff, Lead.priority == LeadPriority.high,
        )
    )).scalar() or 0

    return {
        "conversations": convs,
        "leads": leads,
        "messages": msgs,
        "conversion_rate": round(leads / convs * 100, 1) if convs else 0.0,
        "avg_response_ms": int(avg_rt),
        "escalation_rate": round(escalated_count / convs * 100, 1) if convs else 0.0,
        "avg_confidence": round(float(avg_confidence), 2),
        "avg_messages_per_conversation": round(msgs / convs, 1) if convs else 0.0,
        "high_priority_lead_rate": round(high_priority_leads / leads * 100, 1) if leads else 0.0,
        "changes": {
            "conversations": _pct(convs, prev_convs),
            "leads": _pct(leads, prev_leads),
            "messages": _pct(msgs, prev_msgs),
        },
        "period_days": days,
    }


# ── Daily Trends ──────────────────────────────────────────────────────────────

@router.get("/trends")
async def trends(
    days: int = Query(30, ge=7, le=90),
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    tid = auth.tenant_id
    cutoff = _since(days)

    # Date-bucketed in Python rather than via a SQL date-truncation function —
    # SQLite (strftime) and Postgres (to_char/date_trunc) don't share one
    # portable spelling for "format this timestamp as a day", so this follows
    # the same approach already used below for escalations' JSON tags.
    conv_rows = (await db.execute(
        select(Conversation.created_at).where(
            Conversation.tenant_id == tid, Conversation.created_at >= cutoff,
        )
    )).scalars().all()
    conv_map: dict[str, int] = {}
    for created_at in conv_rows:
        d = created_at.strftime('%Y-%m-%d')
        conv_map[d] = conv_map.get(d, 0) + 1

    lead_rows = (await db.execute(
        select(Lead.created_at).where(
            Lead.tenant_id == tid, Lead.created_at >= cutoff,
        )
    )).scalars().all()
    lead_map: dict[str, int] = {}
    for created_at in lead_rows:
        d = created_at.strftime('%Y-%m-%d')
        lead_map[d] = lead_map.get(d, 0) + 1

    # Escalations per day — Python-side bucketing (see note in summary() re: JSON tags).
    esc_rows = (await db.execute(
        select(Conversation.created_at, Conversation.tags).where(
            Conversation.tenant_id == tid, Conversation.created_at >= cutoff,
        )
    )).all()
    esc_map: dict[str, int] = {}
    for created_at, tags in esc_rows:
        if tags and "escalated" in tags:
            d = created_at.strftime('%Y-%m-%d')
            esc_map[d] = esc_map.get(d, 0) + 1

    all_dates = sorted(set(list(conv_map.keys()) + list(lead_map.keys()) + list(esc_map.keys())))

    return [
        {
            "date": d,
            "conversations": conv_map.get(d, 0),
            "leads": lead_map.get(d, 0),
            "escalations": esc_map.get(d, 0),
        }
        for d in all_dates
    ]


# ── Intent Distribution ───────────────────────────────────────────────────────

@router.get("/intents")
async def intents(
    days: int = Query(30, ge=1, le=365),
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    tid = auth.tenant_id
    cutoff = _since(days)

    rows = (await db.execute(
        select(
            Message.intent,
            func.count(Message.id).label('count'),
        ).join(Conversation, Message.conversation_id == Conversation.id).where(
            Conversation.tenant_id == tid,
            Message.created_at >= cutoff,
            Message.intent.isnot(None),
            Message.role == MessageRole.assistant,
        ).group_by(Message.intent)
        .order_by(func.count(Message.id).desc())
        .limit(8)
    )).all()

    COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#64748B']
    return [
        {"name": r.intent, "value": r.count, "color": COLORS[i % len(COLORS)]}
        for i, r in enumerate(rows)
    ]


# ── Lead Funnel ───────────────────────────────────────────────────────────────

@router.get("/lead-funnel")
async def lead_funnel(
    days: int = Query(30, ge=1, le=365),
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    tid = auth.tenant_id
    cutoff = _since(days)

    rows = (await db.execute(
        select(Lead.status, func.count(Lead.id).label('count')).where(
            Lead.tenant_id == tid,
            Lead.created_at >= cutoff,
        ).group_by(Lead.status)
    )).all()

    STATUS_COLORS = {
        'new': '#3B82F6', 'contacted': '#F59E0B',
        'qualified': '#8B5CF6', 'converted': '#10B981', 'lost': '#EF4444',
    }
    ORDER = ['new', 'contacted', 'qualified', 'converted', 'lost']
    result = {
        r.status.value if hasattr(r.status, 'value') else str(r.status): r.count
        for r in rows
    }
    return [
        {"status": s, "count": result.get(s, 0), "color": STATUS_COLORS[s]}
        for s in ORDER
    ]


# ── Leads by Priority ─────────────────────────────────────────────────────────

@router.get("/leads-by-priority")
async def leads_by_priority(
    days: int = Query(30, ge=1, le=365),
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    tid = auth.tenant_id
    cutoff = _since(days)

    rows = (await db.execute(
        select(Lead.priority, func.count(Lead.id).label('count')).where(
            Lead.tenant_id == tid,
            Lead.created_at >= cutoff,
        ).group_by(Lead.priority)
    )).all()

    PRIORITY_COLORS = {'low': '#94A3B8', 'medium': '#F59E0B', 'high': '#EF4444'}
    ORDER = ['low', 'medium', 'high']
    result = {
        r.priority.value if hasattr(r.priority, 'value') else str(r.priority): r.count
        for r in rows
    }
    return [
        {"priority": p, "count": result.get(p, 0), "color": PRIORITY_COLORS[p]}
        for p in ORDER
    ]


# ── Top Pages ─────────────────────────────────────────────────────────────────

@router.get("/top-pages")
async def top_pages(
    days: int = Query(30, ge=1, le=365),
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    tid = auth.tenant_id
    cutoff = _since(days)

    rows = (await db.execute(
        select(
            Conversation.page_url,
            func.count(Conversation.id).label('count'),
        ).where(
            Conversation.tenant_id == tid,
            Conversation.created_at >= cutoff,
            Conversation.page_url.isnot(None),
        ).group_by(Conversation.page_url)
        .order_by(func.count(Conversation.id).desc())
        .limit(10)
    )).all()

    return [{"url": r.page_url, "count": r.count} for r in rows]
