from datetime import datetime, timedelta, timezone
from typing import Any
import uuid

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# ── Password ──────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password[:72].encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain[:72].encode(), hashed.encode())


# ── JWT ───────────────────────────────────────────────────────────────────────

def _create_token(subject: str, kind: str, expires_delta: timedelta, extra: dict | None = None) -> str:
    payload: dict[str, Any] = {
        "sub": subject,
        "kind": kind,
        "jti": str(uuid.uuid4()),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + expires_delta,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: str, tenant_id: str | None = None) -> str:
    extra = {"tenant_id": tenant_id} if tenant_id else {}
    return _create_token(
        subject=user_id,
        kind="access",
        expires_delta=timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES),
        extra=extra,
    )


def create_refresh_token(user_id: str) -> str:
    return _create_token(
        subject=user_id,
        kind="refresh",
        expires_delta=timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    )


def create_widget_session_token(
    tenant_id: str, widget_config_id: str, visitor_id: str, visitor_meta: dict | None = None,
) -> str:
    """Short-lived session issued once by POST /widget/v1/init. Every later
    /chat or /lead call authenticates with this instead of resending the raw
    widget_key — the key never appears in request bodies again, and a copied
    session token expires quickly instead of working forever."""
    extra = {
        "tenant_id": tenant_id,
        "widget_config_id": widget_config_id,
        "visitor_id": visitor_id,
        "visitor_meta": visitor_meta or {},
    }
    return _create_token(
        subject=visitor_id,
        kind="widget_session",
        expires_delta=timedelta(minutes=settings.WIDGET_SESSION_EXPIRE_MINUTES),
        extra=extra,
    )


def decode_widget_session_token(token: str) -> dict[str, Any]:
    payload = decode_token(token)
    if payload.get("kind") != "widget_session":
        raise JWTError("Not a widget session token")
    return payload


def create_email_token(email: str) -> str:
    return _create_token(
        subject=email,
        kind="email_verify",
        expires_delta=timedelta(hours=24),
    )


def create_password_reset_token(email: str) -> str:
    return _create_token(
        subject=email,
        kind="password_reset",
        expires_delta=timedelta(hours=2),
    )


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT. Raises JWTError on failure."""
    return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])


def decode_access_token(token: str) -> dict[str, Any]:
    payload = decode_token(token)
    if payload.get("kind") != "access":
        raise JWTError("Not an access token")
    return payload


def decode_refresh_token(token: str) -> dict[str, Any]:
    payload = decode_token(token)
    if payload.get("kind") != "refresh":
        raise JWTError("Not a refresh token")
    return payload
