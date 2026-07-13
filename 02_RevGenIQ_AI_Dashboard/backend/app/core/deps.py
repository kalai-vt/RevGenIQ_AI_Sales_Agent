"""
FastAPI dependency injection.

Usage in routes:
    @router.get("/")
    async def my_route(
        auth: AuthContext = Depends(require_auth),
        db: AsyncSession = Depends(get_db),
    ):
        ...
"""
from dataclasses import dataclass
from uuid import UUID

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import Forbidden, InvalidToken, NotAuthenticated, TenantNotFound
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole

bearer = HTTPBearer(auto_error=False)


@dataclass
class AuthContext:
    user: User
    tenant_id: UUID | None
    role: UserRole | None


async def _get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise NotAuthenticated()
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            raise InvalidToken()
    except JWTError:
        raise InvalidToken()

    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == UUID(user_id), User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise NotAuthenticated("User not found or deactivated")
    return user


async def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> AuthContext:
    """Requires a valid JWT. Returns user + tenant context."""
    user = await _get_current_user(credentials, db)
    try:
        payload = decode_access_token(credentials.credentials)
        tid_str = payload.get("tenant_id")
        tenant_id = UUID(tid_str) if tid_str else None
    except Exception:
        tenant_id = None

    role = None
    if tenant_id:
        from sqlalchemy import select
        from app.models.user import TenantMembership
        result = await db.execute(
            select(TenantMembership).where(
                TenantMembership.tenant_id == tenant_id,
                TenantMembership.user_id == user.id,
                TenantMembership.is_active == True,
            )
        )
        membership = result.scalar_one_or_none()
        if membership:
            role = membership.role

    return AuthContext(user=user, tenant_id=tenant_id, role=role)


async def require_tenant(auth: AuthContext = Depends(require_auth)) -> AuthContext:
    """Requires auth AND an active tenant context in the JWT."""
    if not auth.tenant_id:
        raise TenantNotFound()
    return auth


def require_role(*roles: UserRole):
    """Factory: creates a dependency that enforces a minimum role."""
    async def _check(auth: AuthContext = Depends(require_tenant)) -> AuthContext:
        if auth.user.is_superadmin:
            return auth
        if auth.role not in roles:
            raise Forbidden(f"Requires one of: {', '.join(r.value for r in roles)}")
        return auth
    return _check


# ── Convenience role dependencies ─────────────────────────────────────────────
require_owner   = require_role(UserRole.owner)
require_admin   = require_role(UserRole.owner, UserRole.admin)
require_sales   = require_role(UserRole.owner, UserRole.admin, UserRole.sales)
require_support = require_role(UserRole.owner, UserRole.admin, UserRole.support)
require_any     = require_role(*list(UserRole))


async def require_superadmin(auth: AuthContext = Depends(require_auth)) -> AuthContext:
    """Platform admin only."""
    if not auth.user.is_superadmin:
        raise Forbidden("Platform admin access required")
    return auth


async def assert_tenant_member(db: AsyncSession, tenant_id: UUID, user_id: UUID) -> None:
    """Raises if `user_id` isn't an active member of `tenant_id` — call this
    before honoring a client-supplied `assigned_to` on a lead/conversation, so
    a value like another tenant's user_id (or one that's left the workspace)
    can't silently be written in. Not an access-control gap on its own — being
    referenced in `assigned_to` doesn't grant that user anything — but it's a
    real data-integrity hole worth closing rather than leaving in.
    """
    from sqlalchemy import select as _select
    from app.models.user import TenantMembership as _TenantMembership

    result = await db.execute(
        _select(_TenantMembership).where(
            _TenantMembership.tenant_id == tenant_id,
            _TenantMembership.user_id == user_id,
            _TenantMembership.is_active == True,
        )
    )
    if not result.scalar_one_or_none():
        from app.core.exceptions import ValidationError
        raise ValidationError("assigned_to must be an active member of this workspace")
