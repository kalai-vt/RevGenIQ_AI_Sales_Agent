"""
Multi-tenant middleware.

Every authenticated request carries a JWT with `tenant_id`.
The middleware validates it and makes the tenant available via
`request.state.tenant_id` for the entire request lifecycle.

All repository queries automatically apply WHERE tenant_id = :tid,
making cross-tenant data leakage structurally impossible.
"""
from contextvars import ContextVar
from typing import Optional
from uuid import UUID

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.security import decode_access_token

# ── Context variable — scoped to the current request ──────────────────────────
_tenant_id_var: ContextVar[Optional[UUID]] = ContextVar("tenant_id", default=None)
_user_id_var:   ContextVar[Optional[UUID]] = ContextVar("user_id",   default=None)


def get_current_tenant_id() -> Optional[UUID]:
    return _tenant_id_var.get()


def get_current_user_id() -> Optional[UUID]:
    return _user_id_var.get()


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Extracts tenant_id and user_id from JWT and stores them in context vars.
    Does NOT reject the request if the token is missing — that is the job of
    the route-level `Depends(require_auth)` dependency.
    """

    # Routes that do not need tenant context
    _PUBLIC_PREFIXES = (
        "/widget/",
        "/api/v1/auth/",
        "/internal/",
        "/docs",
        "/redoc",
        "/openapi",
        "/health",
    )

    async def dispatch(self, request: Request, call_next) -> Response:
        token_set = _tenant_id_var.set(None)
        user_set  = _user_id_var.set(None)

        try:
            if not any(request.url.path.startswith(p) for p in self._PUBLIC_PREFIXES):
                auth_header = request.headers.get("Authorization", "")
                if auth_header.startswith("Bearer "):
                    try:
                        payload = decode_access_token(auth_header[7:])
                        uid = payload.get("sub")
                        tid = payload.get("tenant_id")
                        if uid:
                            _user_id_var.set(UUID(uid))
                        if tid:
                            _tenant_id_var.set(UUID(tid))
                        request.state.user_id   = UUID(uid) if uid else None
                        request.state.tenant_id = UUID(tid) if tid else None
                    except Exception:
                        pass  # leave context vars as None

            return await call_next(request)
        finally:
            _tenant_id_var.reset(token_set)
            _user_id_var.reset(user_set)
