"""Conversations API — tenant-scoped chat history."""
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import assert_tenant_member, require_admin, require_sales, require_tenant, AuthContext
from app.core.exceptions import NotFound
from app.db.session import get_db
from app.models.conversation import Conversation, ConversationStatus, Message

router = APIRouter(prefix="/conversations", tags=["conversations"])


class ConversationUpdate(BaseModel):
    status: Optional[ConversationStatus] = None
    assigned_to: Optional[UUID] = None
    tags: Optional[list[str]] = None


def _serialize_message(m: Message) -> dict:
    return {
        "id": str(m.id),
        "role": m.role.value,
        "content": m.content,
        "intent": m.intent,
        "confidence": float(m.confidence) if m.confidence is not None else None,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


def _serialize_conversation(c: Conversation, with_messages: bool = False) -> dict:
    data = {
        "id": str(c.id),
        "visitor_id": c.visitor_id,
        "status": c.status.value,
        "channel": c.channel,
        "page_url": c.page_url,
        "country": c.country,
        "city": c.city,
        "assigned_to": str(c.assigned_to) if c.assigned_to else None,
        "lead_id": str(c.lead_id) if c.lead_id else None,
        "summary": c.summary,
        "sentiment": c.sentiment,
        "tags": c.tags,
        "last_message_at": c.last_message_at.isoformat() if c.last_message_at else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }
    if with_messages:
        data["messages"] = [_serialize_message(m) for m in c.messages]
    return data


@router.get("")
async def list_conversations(
    status: Optional[ConversationStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    query = select(Conversation).where(Conversation.tenant_id == auth.tenant_id)
    if status is not None:
        query = query.where(Conversation.status == status)
    query = query.order_by(Conversation.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return [_serialize_conversation(c) for c in result.scalars().all()]


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id, Conversation.tenant_id == auth.tenant_id)
        .options(selectinload(Conversation.messages))
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFound("Conversation")
    return _serialize_conversation(conv, with_messages=True)


@router.patch("/{conversation_id}")
async def update_conversation(
    conversation_id: UUID,
    payload: ConversationUpdate,
    auth: AuthContext = Depends(require_sales),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id, Conversation.tenant_id == auth.tenant_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFound("Conversation")
    if payload.status is not None:
        conv.status = payload.status
        if payload.status == ConversationStatus.closed:
            conv.closed_at = datetime.now(timezone.utc)
    if payload.assigned_to is not None:
        await assert_tenant_member(db, auth.tenant_id, payload.assigned_to)
        conv.assigned_to = payload.assigned_to
    if payload.tags is not None:
        conv.tags = payload.tags
    await db.commit()
    await db.refresh(conv)
    return _serialize_conversation(conv)


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: UUID,
    auth: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id, Conversation.tenant_id == auth.tenant_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFound("Conversation")
    await db.delete(conv)
    await db.commit()
