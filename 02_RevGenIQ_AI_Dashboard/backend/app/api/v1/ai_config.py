"""Authenticated AI configuration — lets a tenant tune the agent's model,
personality, memory, lead-capture, and escalation behavior.

See 03_RevGenIQ_AI_Sales_Marketing_Agent/revgeniq_agent/pipeline.py and the
agents under revgeniq_agent/agents/ for exactly how each field is consumed.
"""
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin, require_tenant, AuthContext
from app.core.exceptions import NotFound
from app.db.session import get_db
from app.models.widget import AIConfig

router = APIRouter(prefix="/ai-config", tags=["ai-config"])

# Models the widget-facing agents actually support (validated against, not just decorative).
SUPPORTED_MODELS = ("gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo")


class AIConfigUpdate(BaseModel):
    llm_model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=50, le=4000)
    system_prompt: Optional[str] = Field(None, max_length=4000)
    fallback_message: Optional[str] = Field(None, max_length=500)
    enable_lead_capture: Optional[bool] = None
    lead_capture_after_messages: Optional[int] = Field(None, ge=0, le=20)
    escalation_enabled: Optional[bool] = None
    escalation_email: Optional[EmailStr] = None
    rag_top_k: Optional[int] = Field(None, ge=1, le=20)
    enable_memory: Optional[bool] = None
    memory_window: Optional[int] = Field(None, ge=1, le=50)


def _serialize(cfg: AIConfig) -> dict:
    return {
        "llm_model": cfg.llm_model,
        "temperature": float(cfg.temperature),
        "max_tokens": cfg.max_tokens,
        "system_prompt": cfg.system_prompt,
        "fallback_message": cfg.fallback_message,
        "enable_lead_capture": cfg.enable_lead_capture,
        "lead_capture_after_messages": cfg.lead_capture_after_messages,
        "escalation_enabled": cfg.escalation_enabled,
        "escalation_email": cfg.escalation_email,
        "rag_top_k": cfg.rag_top_k,
        "enable_memory": cfg.enable_memory,
        "memory_window": cfg.memory_window,
        "supported_models": list(SUPPORTED_MODELS),
    }


async def _get_config(tenant_id, db: AsyncSession) -> AIConfig:
    result = await db.execute(select(AIConfig).where(AIConfig.tenant_id == tenant_id))
    cfg = result.scalar_one_or_none()
    if not cfg:
        raise NotFound("AI configuration")
    return cfg


@router.get("")
async def get_ai_config(
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    cfg = await _get_config(auth.tenant_id, db)
    return _serialize(cfg)


@router.patch("")
async def update_ai_config(
    payload: AIConfigUpdate,
    auth: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    cfg = await _get_config(auth.tenant_id, db)
    updates = payload.model_dump(exclude_unset=True)

    if "llm_model" in updates and updates["llm_model"] not in SUPPORTED_MODELS:
        from app.core.exceptions import ValidationError
        raise ValidationError(f"llm_model must be one of: {', '.join(SUPPORTED_MODELS)}")

    if "escalation_enabled" in updates and updates["escalation_enabled"] and not (
        updates.get("escalation_email") or cfg.escalation_email
    ):
        from app.core.exceptions import ValidationError
        raise ValidationError("escalation_email is required to enable escalation")

    for field, value in updates.items():
        setattr(cfg, field, value)
    await db.commit()
    await db.refresh(cfg)
    return _serialize(cfg)
