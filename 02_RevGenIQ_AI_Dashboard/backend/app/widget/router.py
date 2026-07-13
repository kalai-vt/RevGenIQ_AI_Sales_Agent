"""
Public Widget API — identified by widget_key (only at /init), no dashboard
JWT required. Rate limited separately from the authenticated dashboard API.
"""
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import FileResponse
from jose import JWTError
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.geo import geo_from_headers, parse_user_agent
from app.core.rate_limit import rate_limit
from app.core.security import create_widget_session_token, decode_widget_session_token
from app.db.session import get_db
from app.models.widget import WidgetConfig, AIConfig
from app.models.tenant import Tenant
from app.models.conversation import Conversation, Message, ConversationStatus, MessageRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/widget/v1", tags=["widget-public"])

_STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


@router.get("/loader.js")
async def loader_js():
    """The embeddable <script> a client site includes, e.g.:
    <script src=".../widget/v1/loader.js" data-widget-key="..." async></script>
    """
    return FileResponse(
        os.path.join(_STATIC_DIR, "loader.js"),
        media_type="application/javascript",
        headers={"Cache-Control": "public, max-age=300"},
    )


@router.get("/branding-logo.png")
async def branding_logo():
    """RevGenIQ AI's own logo, shown in the widget's 'Powered by' footer —
    this is platform branding, not a tenant's own logo."""
    return FileResponse(
        os.path.join(_STATIC_DIR, "branding-logo.png"),
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )


# ── Schemas ───────────────────────────────────────────────────────────────────

class InitRequest(BaseModel):
    widget_key: str
    page_url: Optional[str] = None
    timezone: Optional[str] = None


class ChatRequest(BaseModel):
    # widget_key is now optional — a widget session token (Authorization
    # header, issued by /init) is the preferred way to authenticate. Kept
    # here only so a request without a session yet (or an old cached
    # loader.js) still works during rollout.
    widget_key: Optional[str] = None
    message: str
    session_token: Optional[str] = None
    conversation_history: list[dict] = []
    page_url: Optional[str] = None
    visitor_id: Optional[str] = None


class LeadCaptureRequest(BaseModel):
    widget_key: Optional[str] = None
    session_token: Optional[str] = None
    name: str
    email: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    requirement: Optional[str] = None
    quantity: Optional[str] = None
    country: Optional[str] = None
    # Which CTA form the visitor submitted (quote/demo/contact) — purely for
    # dashboard/analytics context; capture behavior is otherwise identical.
    form_type: Optional[str] = None


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _resolve_widget(widget_key: str, db: AsyncSession) -> tuple[Tenant, WidgetConfig, AIConfig]:
    try:
        wk_uuid = uuid.UUID(widget_key)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid widget key")

    result = await db.execute(
        select(WidgetConfig).where(WidgetConfig.widget_key == wk_uuid, WidgetConfig.is_active == True)
    )
    widget = result.scalar_one_or_none()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == widget.tenant_id, Tenant.is_active == True))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Workspace not found")

    ai_result = await db.execute(select(AIConfig).where(AIConfig.tenant_id == widget.tenant_id))
    ai_config = ai_result.scalar_one_or_none()

    return tenant, widget, ai_config


async def _resolve_by_ids(tenant_id: uuid.UUID, widget_config_id: uuid.UUID, db: AsyncSession) -> tuple[Tenant, WidgetConfig, AIConfig]:
    """Same shape as _resolve_widget, but skips the widget_key lookup — used
    once a request already carries a validated session token."""
    widget_result = await db.execute(
        select(WidgetConfig).where(WidgetConfig.id == widget_config_id, WidgetConfig.tenant_id == tenant_id, WidgetConfig.is_active == True)
    )
    widget = widget_result.scalar_one_or_none()
    if not widget:
        raise HTTPException(status_code=404, detail="Widget not found")

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id, Tenant.is_active == True))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Workspace not found")

    ai_result = await db.execute(select(AIConfig).where(AIConfig.tenant_id == tenant_id))
    ai_config = ai_result.scalar_one_or_none()

    return tenant, widget, ai_config


def _hostname(url: str | None) -> str | None:
    if not url:
        return None
    try:
        parsed = urlparse(url if "//" in url else f"//{url}")
        return (parsed.hostname or "").lower() or None
    except ValueError:
        return None


def _domain_allowed(allowed_domains: list, origin_host: str | None) -> bool:
    """Empty allowlist = unrestricted (today's default, so no existing
    customer is broken by adding this check). A leading "." allows any
    subdomain, e.g. ".example.com" also matches "widget.example.com"."""
    if not allowed_domains:
        return True
    if not origin_host:
        return False
    for domain in allowed_domains:
        domain = str(domain).lower().strip()
        if not domain:
            continue
        if domain.startswith("."):
            if origin_host == domain[1:] or origin_host.endswith(domain):
                return True
        elif origin_host == domain:
            return True
    return False


async def _authenticate(
    request: Request,
    db: AsyncSession,
    widget_key_fallback: str | None,
    authorization: str | None,
) -> tuple[Tenant, WidgetConfig, AIConfig, str | None, dict]:
    """Accepts either a widget-session bearer token (preferred) or a raw
    widget_key in the body (back-compat during rollout). Returns the usual
    (tenant, widget, ai_config) plus the visitor_id and visitor_meta carried
    in the session token, if any."""
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:]
        try:
            payload = decode_widget_session_token(token)
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        tenant, widget, ai_config = await _resolve_by_ids(
            uuid.UUID(payload["tenant_id"]), uuid.UUID(payload["widget_config_id"]), db,
        )
        return tenant, widget, ai_config, payload.get("visitor_id"), payload.get("visitor_meta") or {}

    if widget_key_fallback:
        # Same origin check as /init — otherwise this fallback path would be
        # a standing bypass of the allowlist for anyone who skips /init and
        # calls /chat or /lead directly with a copied widget_key.
        tenant, widget, ai_config = await _resolve_widget(widget_key_fallback, db)
        origin_host = _hostname(request.headers.get("origin")) or _hostname(request.headers.get("referer"))
        if not _domain_allowed(widget.allowed_domains or [], origin_host):
            raise HTTPException(status_code=403, detail="This domain is not authorized to use this widget")
        return tenant, widget, ai_config, None, {}

    raise HTTPException(status_code=401, detail="Missing widget session — call /widget/v1/init first")


async def _get_or_create_session(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    session_token: str | None,
    visitor_id: str,
    page_url: str | None,
    visitor_meta: dict | None = None,
) -> tuple[Conversation, bool]:
    """Returns (conversation, is_new)."""
    if session_token:
        result = await db.execute(
            select(Conversation).where(
                Conversation.session_token == session_token,
                Conversation.tenant_id == tenant_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return existing, False

    meta = visitor_meta or {}
    token = session_token or f"sess_{uuid.uuid4().hex}"
    conv = Conversation(
        tenant_id=tenant_id,
        visitor_id=visitor_id or f"v_{uuid.uuid4().hex[:12]}",
        session_token=token,
        page_url=page_url,
        country=meta.get("country"),
        city=meta.get("city"),
        browser=meta.get("browser"),
        os=meta.get("os"),
        device_type=meta.get("device_type"),
        timezone=meta.get("timezone"),
        referrer=meta.get("referrer"),
    )
    db.add(conv)
    await db.flush()
    return conv, True


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/config/{widget_key}")
async def get_widget_config(widget_key: str, db: AsyncSession = Depends(get_db)):
    """Kept for back-compat with any already-cached loader.js; new loads use
    POST /init instead, which returns this same shape plus a session token."""
    tenant, widget, _ = await _resolve_widget(widget_key, db)
    return _config_payload(tenant, widget)


def _config_payload(tenant: Tenant, widget: WidgetConfig) -> dict:
    return {
        "agent_name": widget.agent_name,
        "welcome_message": widget.welcome_message,
        "placeholder_text": widget.placeholder_text,
        "primary_color": widget.primary_color,
        "secondary_color": widget.secondary_color,
        "text_color": widget.text_color,
        "position": widget.position,
        "logo_url": widget.logo_url or tenant.logo_url,
        "avatar_url": widget.avatar_url,
        "language": widget.language,
        "suggested_questions": widget.suggested_questions,
        "show_branding": widget.show_branding,
        "enable_file_upload": widget.enable_file_upload,
        "enable_voice": widget.enable_voice,
        "company_name": tenant.name,
        "primary_company_color": tenant.primary_color,
        "website_url": tenant.website_url,
    }


@router.post("/init", dependencies=[Depends(rate_limit("init", 20))])
async def init_widget(
    body: InitRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Called once when the widget loads. Validates the widget_key, checks
    the calling origin against the tenant's allowed_domains (if configured),
    and exchanges the key for a short-lived session token — every later
    /chat and /lead call authenticates with that token instead of resending
    the raw key."""
    tenant, widget, _ = await _resolve_widget(body.widget_key, db)

    origin_host = _hostname(request.headers.get("origin")) or _hostname(request.headers.get("referer"))
    if not _domain_allowed(widget.allowed_domains or [], origin_host):
        raise HTTPException(status_code=403, detail="This domain is not authorized to use this widget")

    ua = parse_user_agent(request.headers.get("user-agent"))
    geo = geo_from_headers(request)
    visitor_meta = {
        **ua,
        **geo,
        "timezone": body.timezone,
        "referrer": request.headers.get("referer"),
    }

    visitor_id = f"v_{uuid.uuid4().hex[:12]}"
    session_token = create_widget_session_token(
        tenant_id=str(tenant.id),
        widget_config_id=str(widget.id),
        visitor_id=visitor_id,
        visitor_meta=visitor_meta,
    )

    return {
        **_config_payload(tenant, widget),
        "session_token": session_token,
        "visitor_id": visitor_id,
    }


@router.post("/chat", dependencies=[Depends(rate_limit("chat", 30))])
async def chat(
    req: ChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    tenant, widget, ai_config, session_visitor_id, visitor_meta = await _authenticate(
        request, db, req.widget_key, authorization,
    )

    conv, is_new = await _get_or_create_session(
        db, tenant.id, req.session_token, req.visitor_id or session_visitor_id or "", req.page_url, visitor_meta,
    )

    # Build company context for the AI pipeline
    company_context = {
        "id": str(tenant.id),
        "name": tenant.name,
        "description": tenant.description,
        "industry": tenant.industry,
        "support_email": tenant.support_email,
        "sales_email": tenant.sales_email,
        "website_url": tenant.website_url,
        "phone": tenant.phone,
        "country": tenant.country,
        "business_hours": widget.business_hours,
        "agent_name": widget.agent_name,
        "welcome_message": widget.welcome_message,
    }
    if ai_config:
        company_context.update({
            "system_prompt": ai_config.system_prompt,
            "temperature": float(ai_config.temperature),
            "max_tokens": ai_config.max_tokens,
            "llm_model": ai_config.llm_model,
            "rag_top_k": ai_config.rag_top_k,
            "enable_lead_capture": ai_config.enable_lead_capture,
            "lead_capture_after_messages": ai_config.lead_capture_after_messages,
            "enable_memory": ai_config.enable_memory,
            "memory_window": ai_config.memory_window,
            "escalation_enabled": ai_config.escalation_enabled,
            "escalation_email": ai_config.escalation_email,
        })

    # Save user message
    user_msg = Message(
        tenant_id=tenant.id,
        conversation_id=conv.id,
        role=MessageRole.user,
        content=req.message,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user_msg)

    # Run AI pipeline
    import time
    t0 = time.monotonic()
    try:
        from revgeniq_agent.pipeline import run_pipeline
        result = await run_pipeline(
            message=req.message,
            company_id=str(tenant.id),
            company_context=company_context,
            conversation_history=req.conversation_history,
            db=db,
            conversation_id=str(conv.id),
        )
    except Exception as exc:
        result = {
            "response_type": "error",
            "message": ai_config.fallback_message if ai_config and ai_config.fallback_message
                       else f"I'm having trouble right now. Please contact {tenant.support_email or 'us'} directly.",
        }

    elapsed_ms = int((time.monotonic() - t0) * 1000)

    # Save assistant message
    ai_msg = Message(
        tenant_id=tenant.id,
        conversation_id=conv.id,
        role=MessageRole.assistant,
        content=result.get("message", ""),
        structured_response=result,
        intent=result.get("intent"),
        confidence=result.get("confidence"),
        lead_score=result.get("lead_score"),
        tokens_used=result.get("tokens_used"),
        response_time_ms=elapsed_ms,
        created_at=datetime.now(timezone.utc),
    )
    db.add(ai_msg)

    # Update conversation
    conv.last_message_at = datetime.now(timezone.utc)

    # Escalate to a human if the agent flagged it and the tenant has it enabled
    if result.get("needs_escalation") and ai_config and ai_config.escalation_enabled and ai_config.escalation_email:
        if "escalated" not in (conv.tags or []):
            conv.tags = [*(conv.tags or []), "escalated"]
        try:
            from app.services.email_service import send_email
            await send_email(
                to=ai_config.escalation_email,
                subject=f"[{tenant.name}] Chat escalation needs attention",
                body=(
                    f"A conversation with visitor {conv.visitor_id} was flagged for human follow-up.\n\n"
                    f"Visitor said: {req.message}\n\n"
                    f"AI response: {result.get('message', '')}\n\n"
                    f"Page: {req.page_url or 'unknown'}"
                ),
            )
        except Exception as exc:
            logger.warning("Escalation email failed: %s", exc)

    # Record analytics
    try:
        from app.models.analytics import AnalyticsEvent
        db.add(AnalyticsEvent(
            tenant_id=tenant.id,
            event_type="message",
            conversation_id=conv.id,
            visitor_id=conv.visitor_id,
            created_at=datetime.now(timezone.utc),
        ))
        if is_new:
            db.add(AnalyticsEvent(
                tenant_id=tenant.id,
                event_type="conversation",
                conversation_id=conv.id,
                visitor_id=conv.visitor_id,
                created_at=datetime.now(timezone.utc),
            ))
    except Exception:
        pass

    await db.flush()

    return {
        **result,
        "session_token": conv.session_token,
        "response_time_ms": elapsed_ms,
    }


@router.post("/lead", dependencies=[Depends(rate_limit("lead", 10))])
async def capture_lead(
    req: LeadCaptureRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    authorization: Optional[str] = Header(None),
):
    tenant, widget, _, _, _ = await _authenticate(request, db, req.widget_key, authorization)

    conversation_id = None
    if req.session_token:
        result = await db.execute(
            select(Conversation).where(
                Conversation.session_token == req.session_token,
                Conversation.tenant_id == tenant.id,
            )
        )
        conv = result.scalar_one_or_none()
        if conv:
            conversation_id = conv.id

    from app.models.lead import Lead
    lead = Lead(
        tenant_id=tenant.id,
        conversation_id=conversation_id,
        name=req.name,
        email=req.email,
        phone=req.phone,
        company_name=req.company_name,
        requirement=req.requirement,
        quantity=req.quantity,
        country=req.country,
        source=f"widget_{req.form_type}" if req.form_type else "widget_form",
    )
    db.add(lead)

    # Record analytics
    from app.models.analytics import AnalyticsEvent
    db.add(AnalyticsEvent(
        tenant_id=tenant.id,
        event_type="lead",
        conversation_id=conversation_id,
        created_at=datetime.now(timezone.utc),
    ))

    await db.flush()
    return {"success": True, "lead_id": str(lead.id)}


@router.get("/health")
async def health():
    return {"status": "ok"}
