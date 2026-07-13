"""Team management — members, roles, and email invitations.

Uses the existing `TenantMembership` (role, is_active) and `Invitation`
(token, expires_at, accepted_at) models — both were already defined in the
schema but had no API wired to them until now.
"""
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import require_admin, require_auth, require_tenant, AuthContext
from app.core.exceptions import Conflict, Forbidden, NotFound, ValidationError
from app.core.security import create_access_token
from app.db.session import get_db
from app.models.tenant import Invitation, Tenant
from app.models.user import TenantMembership, User, UserRole

router = APIRouter(prefix="/team", tags=["team"])

logger = logging.getLogger(__name__)

INVITE_EXPIRY_DAYS = 7
INVITABLE_ROLES = (UserRole.admin, UserRole.sales, UserRole.support, UserRole.viewer)


def _aware(dt: datetime) -> datetime:
    """SQLite drops tzinfo on round-trip even for `DateTime(timezone=True)`
    columns, so naive datetimes read back from the DB must be re-tagged as
    UTC before comparing against a timezone-aware `datetime.now(timezone.utc)`."""
    return dt if dt.tzinfo is not None else dt.replace(tzinfo=timezone.utc)


class InviteCreate(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.viewer


class MemberRoleUpdate(BaseModel):
    role: UserRole


def _serialize_member(m: TenantMembership, user: User, current_user_id: UUID) -> dict:
    return {
        "membership_id": str(m.id),
        "user_id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "role": m.role.value,
        "is_active": m.is_active,
        "joined_at": m.joined_at.isoformat() if m.joined_at else None,
        "is_you": user.id == current_user_id,
    }


def _serialize_invitation(inv: Invitation) -> dict:
    return {
        "id": str(inv.id),
        "email": inv.email,
        "role": inv.role,
        "expires_at": inv.expires_at.isoformat(),
        "created_at": inv.created_at.isoformat(),
        "is_expired": _aware(inv.expires_at) < datetime.now(timezone.utc),
    }


async def _owner_count(db: AsyncSession, tenant_id: UUID) -> int:
    return (await db.execute(
        select(func.count(TenantMembership.id)).where(
            TenantMembership.tenant_id == tenant_id,
            TenantMembership.role == UserRole.owner,
            TenantMembership.is_active == True,
        )
    )).scalar() or 0


# ── Members ───────────────────────────────────────────────────────────────────

@router.get("/members")
async def list_members(
    auth: AuthContext = Depends(require_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TenantMembership, User)
        .join(User, User.id == TenantMembership.user_id)
        .where(TenantMembership.tenant_id == auth.tenant_id, TenantMembership.is_active == True)
        .order_by(TenantMembership.created_at)
    )
    return [_serialize_member(m, u, auth.user.id) for m, u in result.all()]


@router.patch("/members/{membership_id}")
async def update_member_role(
    membership_id: UUID,
    payload: MemberRoleUpdate,
    auth: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TenantMembership).where(
            TenantMembership.id == membership_id, TenantMembership.tenant_id == auth.tenant_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise NotFound("Team member")

    if membership.user_id == auth.user.id:
        raise Forbidden("You cannot change your own role")
    if membership.role == UserRole.owner and payload.role != UserRole.owner:
        if await _owner_count(db, auth.tenant_id) <= 1:
            raise ValidationError("Cannot demote the last owner of the workspace")

    membership.role = payload.role
    await db.commit()
    user = (await db.execute(select(User).where(User.id == membership.user_id))).scalar_one()
    return _serialize_member(membership, user, auth.user.id)


@router.delete("/members/{membership_id}", status_code=204)
async def remove_member(
    membership_id: UUID,
    auth: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TenantMembership).where(
            TenantMembership.id == membership_id, TenantMembership.tenant_id == auth.tenant_id,
        )
    )
    membership = result.scalar_one_or_none()
    if not membership:
        raise NotFound("Team member")

    if membership.user_id == auth.user.id:
        raise Forbidden("You cannot remove yourself from the workspace")
    if membership.role == UserRole.owner and await _owner_count(db, auth.tenant_id) <= 1:
        raise ValidationError("Cannot remove the last owner of the workspace")

    await db.delete(membership)
    await db.commit()


# ── Invitations ───────────────────────────────────────────────────────────────

@router.get("/invitations")
async def list_invitations(
    auth: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invitation)
        .where(Invitation.tenant_id == auth.tenant_id, Invitation.accepted_at.is_(None))
        .order_by(Invitation.created_at.desc())
    )
    return [_serialize_invitation(i) for i in result.scalars().all()]


@router.post("/invitations", status_code=201)
async def create_invitation(
    payload: InviteCreate,
    auth: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    if payload.role not in INVITABLE_ROLES:
        raise ValidationError(f"role must be one of: {', '.join(r.value for r in INVITABLE_ROLES)}")

    email = payload.email.lower().strip()

    existing_member = (await db.execute(
        select(TenantMembership)
        .join(User, User.id == TenantMembership.user_id)
        .where(TenantMembership.tenant_id == auth.tenant_id, User.email == email)
    )).scalar_one_or_none()
    if existing_member:
        raise Conflict("This person is already a member of your workspace")

    # Refresh any existing pending invite for this email instead of duplicating it.
    existing_invite = (await db.execute(
        select(Invitation).where(
            Invitation.tenant_id == auth.tenant_id, Invitation.email == email, Invitation.accepted_at.is_(None),
        )
    )).scalar_one_or_none()

    now = datetime.now(timezone.utc)
    token = secrets.token_urlsafe(32)
    expires_at = now + timedelta(days=INVITE_EXPIRY_DAYS)

    if existing_invite:
        existing_invite.role = payload.role.value
        existing_invite.token = token
        existing_invite.expires_at = expires_at
        existing_invite.invited_by = auth.user.id
        invitation = existing_invite
    else:
        invitation = Invitation(
            tenant_id=auth.tenant_id, email=email, role=payload.role.value,
            token=token, invited_by=auth.user.id, expires_at=expires_at,
        )
        db.add(invitation)

    await db.commit()

    tenant = (await db.execute(select(Tenant).where(Tenant.id == auth.tenant_id))).scalar_one()
    accept_url = f"{settings.FRONTEND_URL}/accept-invite?token={token}"
    try:
        from app.services.email_service import send_email
        await send_email(
            to=email,
            subject=f"You've been invited to join {tenant.name} on RevGenIQ AI",
            body=(
                f"{auth.user.full_name or auth.user.email} invited you to join {tenant.name} "
                f"as {payload.role.value}.\n\nAccept your invitation: {accept_url}\n\n"
                f"This link expires in {INVITE_EXPIRY_DAYS} days."
            ),
        )
    except Exception as exc:
        logger.warning("Invite email failed: %s", exc)

    return _serialize_invitation(invitation)


@router.delete("/invitations/{invitation_id}", status_code=204)
async def revoke_invitation(
    invitation_id: UUID,
    auth: AuthContext = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invitation).where(Invitation.id == invitation_id, Invitation.tenant_id == auth.tenant_id)
    )
    invitation = result.scalar_one_or_none()
    if not invitation:
        raise NotFound("Invitation")
    await db.delete(invitation)
    await db.commit()


# ── Public accept-invite flow ─────────────────────────────────────────────────

@router.get("/invitations/{token}/preview")
async def preview_invitation(token: str, db: AsyncSession = Depends(get_db)):
    """Public, unauthenticated — lets the accept-invite page show what the
    invite is for before the visitor logs in or signs up."""
    invitation = (await db.execute(select(Invitation).where(Invitation.token == token))).scalar_one_or_none()
    if not invitation:
        raise NotFound("Invitation")
    if invitation.accepted_at:
        raise Conflict("This invitation has already been accepted")
    if _aware(invitation.expires_at) < datetime.now(timezone.utc):
        raise Conflict("This invitation has expired")

    tenant = (await db.execute(select(Tenant).where(Tenant.id == invitation.tenant_id))).scalar_one()
    return {
        "email": invitation.email,
        "role": invitation.role,
        "workspace_name": tenant.name,
        "expires_at": invitation.expires_at.isoformat(),
    }


@router.post("/invitations/{token}/accept")
async def accept_invitation(
    token: str,
    auth: AuthContext = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    invitation = (await db.execute(select(Invitation).where(Invitation.token == token))).scalar_one_or_none()
    if not invitation:
        raise NotFound("Invitation")
    if invitation.accepted_at:
        raise Conflict("This invitation has already been accepted")
    if _aware(invitation.expires_at) < datetime.now(timezone.utc):
        raise Conflict("This invitation has expired")
    if invitation.email != auth.user.email.lower().strip():
        raise Forbidden("This invitation was sent to a different email address")

    existing = (await db.execute(
        select(TenantMembership).where(
            TenantMembership.tenant_id == invitation.tenant_id, TenantMembership.user_id == auth.user.id,
        )
    )).scalar_one_or_none()
    if existing:
        raise Conflict("You are already a member of this workspace")

    membership = TenantMembership(
        tenant_id=invitation.tenant_id,
        user_id=auth.user.id,
        role=UserRole(invitation.role),
        invited_by=invitation.invited_by,
        joined_at=datetime.now(timezone.utc),
    )
    db.add(membership)
    invitation.accepted_at = datetime.now(timezone.utc)
    await db.commit()

    access_token = create_access_token(str(auth.user.id), str(invitation.tenant_id))
    tenant = (await db.execute(select(Tenant).where(Tenant.id == invitation.tenant_id))).scalar_one()
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "workspace": {"id": str(tenant.id), "name": tenant.name, "slug": tenant.slug, "logo_url": tenant.logo_url},
    }
