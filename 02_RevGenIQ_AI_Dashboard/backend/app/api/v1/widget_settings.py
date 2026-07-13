"""Authenticated widget settings — lets a tenant view/customize their own
widget config and grab the embed snippet (see app/widget/router.py for the
public, unauthenticated widget-facing endpoints keyed by widget_key)."""
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin, require_tenant, AuthContext
from app.core.exceptions import NotFound
from app.db.session import get_db
from app.models.widget import WidgetConfig

router = APIRouter(prefix="/widget-settings", tags=["widget-settings"])


class WidgetSettingsUpdate(BaseModel):
    agent_name: Optional[str] = None
    welcome_message: Optional[str] = None
    placeholder_text: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    text_color: Optional[str] = None
    position: Optional[str] = None
    show_branding: Optional[bool] = None
    suggested_questions: Optional[list[str]] = None
    allowed_domains: Optional[list[str]] = None


def _serialize(widget: WidgetConfig) -> dict:
    return {
        "widget_key": str(widget.widget_key),
        "agent_name": widget.agent_name,
        "welcome_message": widget.welcome_message,
        "placeholder_text": widget.placeholder_text,
        "primary_color": widget.primary_color,
        "secondary_color": widget.secondary_color,
        "text_color": widget.text_color,
        "position": widget.position,
        "show_branding": widget.show_branding,
        "suggested_questions": widget.suggested_questions,
        "allowed_domains": widget.allowed_domains,
        "is_active": widget.is_active,
    }


async def _get_widget(tenant_id, db: AsyncSession) -> WidgetConfig:
    result = await db.execute(select(WidgetConfig).where(WidgetConfig.tenant_id == tenant_id))
    widget = result.scalar_one_or_none()
    if not widget:
        raise NotFound("Widget configuration")
    return widget


@router.get("")
async def get_widget_settings(
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    widget = await _get_widget(auth.tenant_id, db)
    return _serialize(widget)


@router.patch("")
async def update_widget_settings(
    payload: WidgetSettingsUpdate,
    auth: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    widget = await _get_widget(auth.tenant_id, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(widget, field, value)
    await db.commit()
    await db.refresh(widget)
    return _serialize(widget)
