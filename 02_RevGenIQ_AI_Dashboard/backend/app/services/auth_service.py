"""
Auth service — handles registration, login, token refresh, email verification,
password reset, and workspace selection.
"""
import re
import secrets
from datetime import datetime, timezone, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import Conflict, InvalidToken, NotAuthenticated, NotFound, ValidationError
from app.core.security import (
    create_access_token, create_refresh_token,
    create_email_token, create_password_reset_token,
    decode_refresh_token, decode_token,
    hash_password, verify_password,
)
from app.models.user import User, TenantMembership, UserRole
from app.models.tenant import Tenant


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ── Registration ──────────────────────────────────────────────────────────

    async def register(self, email: str, password: str, full_name: str) -> User:
        email = email.lower().strip()
        self._validate_password(password)

        existing = await self._get_user_by_email(email)
        if existing:
            raise Conflict("An account with this email already exists")

        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
            is_verified=not settings.is_production,  # skip verification in dev
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    # ── Login ─────────────────────────────────────────────────────────────────

    async def login(self, email: str, password: str) -> tuple[User, str, str]:
        """Returns (user, access_token, refresh_token)."""
        user = await self._get_user_by_email(email.lower().strip())
        if not user or not user.hashed_password:
            raise NotAuthenticated("Invalid email or password")
        if not verify_password(password, user.hashed_password):
            raise NotAuthenticated("Invalid email or password")
        if not user.is_active:
            raise NotAuthenticated("Account is deactivated")

        user.last_login_at = datetime.now(timezone.utc)
        await self.db.flush()

        # Find the user's first active workspace
        membership = await self._get_first_membership(user.id)
        tenant_id = str(membership.tenant_id) if membership else None

        access_token  = create_access_token(str(user.id), tenant_id)
        refresh_token = create_refresh_token(str(user.id))
        return user, access_token, refresh_token

    # ── Token operations ──────────────────────────────────────────────────────

    async def refresh(self, refresh_token: str) -> tuple[str, str]:
        """Return new (access_token, refresh_token) pair."""
        try:
            payload = decode_refresh_token(refresh_token)
            user_id = payload["sub"]
        except Exception:
            raise InvalidToken("Invalid or expired refresh token")

        user = await self._get_user_by_id(UUID(user_id))
        if not user or not user.is_active:
            raise InvalidToken()

        membership = await self._get_first_membership(user.id)
        tenant_id = str(membership.tenant_id) if membership else None

        new_access  = create_access_token(str(user.id), tenant_id)
        new_refresh = create_refresh_token(str(user.id))
        return new_access, new_refresh

    async def switch_tenant(self, user: User, tenant_id: UUID) -> str:
        """Issue a new access token scoped to a specific tenant."""
        result = await self.db.execute(
            select(TenantMembership).where(
                TenantMembership.user_id == user.id,
                TenantMembership.tenant_id == tenant_id,
                TenantMembership.is_active == True,
            )
        )
        if not result.scalar_one_or_none():
            raise NotFound("Workspace")
        return create_access_token(str(user.id), str(tenant_id))

    # ── Email verification ────────────────────────────────────────────────────

    async def verify_email(self, token: str) -> User:
        try:
            payload = decode_token(token)
            if payload.get("kind") != "email_verify":
                raise ValueError()
            email = payload["sub"]
        except Exception:
            raise InvalidToken("Invalid or expired verification link")

        user = await self._get_user_by_email(email)
        if not user:
            raise NotFound("User")

        user.is_verified = True
        user.email_verified_at = datetime.now(timezone.utc)
        await self.db.flush()
        return user

    # ── Password reset ────────────────────────────────────────────────────────

    async def request_password_reset(self, email: str) -> str | None:
        """Returns the reset token (to be emailed). Returns None if user not found (silent)."""
        user = await self._get_user_by_email(email.lower().strip())
        if not user:
            return None
        return create_password_reset_token(email)

    async def reset_password(self, token: str, new_password: str) -> User:
        try:
            payload = decode_token(token)
            if payload.get("kind") != "password_reset":
                raise ValueError()
            email = payload["sub"]
        except Exception:
            raise InvalidToken("Invalid or expired reset link")

        self._validate_password(new_password)
        user = await self._get_user_by_email(email)
        if not user:
            raise NotFound("User")

        user.hashed_password = hash_password(new_password)
        await self.db.flush()
        return user

    # ── Workspace creation ────────────────────────────────────────────────────

    async def create_workspace(self, user: User, name: str, website_url: str = "", industry: str | None = None) -> tuple[Tenant, str]:
        slug = self._make_slug(name)

        # Ensure unique slug
        existing = await self.db.execute(select(Tenant).where(Tenant.slug == slug))
        if existing.scalar_one_or_none():
            slug = f"{slug}-{secrets.token_hex(3)}"

        tenant = Tenant(name=name, slug=slug, website_url=website_url or None, industry=industry or None)
        self.db.add(tenant)
        await self.db.flush()

        membership = TenantMembership(
            tenant_id=tenant.id,
            user_id=user.id,
            role=UserRole.owner,
            joined_at=datetime.now(timezone.utc),
        )
        self.db.add(membership)

        # Create default widget and AI configs
        from app.models.widget import WidgetConfig, AIConfig
        self.db.add(WidgetConfig(tenant_id=tenant.id, welcome_message=f"Hello! I'm the AI assistant for {name}. How can I help you today?"))
        self.db.add(AIConfig(tenant_id=tenant.id))
        await self.db.flush()

        access_token = create_access_token(str(user.id), str(tenant.id))
        return tenant, access_token

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _get_user_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def _get_user_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def _get_first_membership(self, user_id: UUID) -> TenantMembership | None:
        result = await self.db.execute(
            select(TenantMembership)
            .where(TenantMembership.user_id == user_id, TenantMembership.is_active == True)
            .order_by(TenantMembership.created_at)
            .limit(1)
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _validate_password(password: str) -> None:
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters")

    @staticmethod
    def _make_slug(name: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower().strip()).strip("-")
        return slug[:50] or "workspace"
