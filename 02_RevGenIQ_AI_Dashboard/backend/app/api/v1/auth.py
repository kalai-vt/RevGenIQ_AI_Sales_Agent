from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import AuthContext, require_auth
from app.core.rate_limit import rate_limit
from app.db.session import get_db
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class WorkspaceCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    website_url: Optional[str] = None
    industry: Optional[str] = None


class RefreshIn(BaseModel):
    refresh_token: str


class PasswordResetRequestIn(BaseModel):
    email: EmailStr


class PasswordResetIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class SwitchTenantIn(BaseModel):
    tenant_id: UUID


class ProfileUpdateIn(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    avatar_url: Optional[str] = None


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: Optional[str]
    avatar_url: Optional[str]
    is_verified: bool

    model_config = {"from_attributes": True}


class WorkspaceOut(BaseModel):
    id: UUID
    name: str
    slug: str
    logo_url: Optional[str]

    model_config = {"from_attributes": True}


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201, dependencies=[Depends(rate_limit("register", 10))])
async def register(body: RegisterIn, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    user = await svc.register(body.email, body.password, body.full_name)
    return {"message": "Account created. Check your email to verify.", "user_id": str(user.id)}


@router.post("/login", response_model=TokenOut, dependencies=[Depends(rate_limit("login", 10))])
async def login(body: LoginIn, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    user, access_token, refresh_token = await svc.login(body.email, body.password)
    return TokenOut(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenOut)
async def refresh(body: RefreshIn, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    access_token, refresh_token = await svc.refresh(body.refresh_token)
    return TokenOut(access_token=access_token, refresh_token=refresh_token)


@router.get("/verify-email/{token}")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    await svc.verify_email(token)
    return {"message": "Email verified successfully"}


@router.post("/forgot-password", dependencies=[Depends(rate_limit("forgot_password", 5))])
async def forgot_password(body: PasswordResetRequestIn, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    await svc.request_password_reset(body.email)
    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(body: PasswordResetIn, db: AsyncSession = Depends(get_db)):
    svc = AuthService(db)
    await svc.reset_password(body.token, body.new_password)
    return {"message": "Password updated. Please log in."}


@router.get("/me", response_model=UserOut)
async def me(auth: AuthContext = Depends(require_auth)):
    return auth.user


@router.patch("/me", response_model=UserOut)
async def update_me(
    body: ProfileUpdateIn,
    auth: AuthContext = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    if body.full_name is not None:
        auth.user.full_name = body.full_name
    if body.avatar_url is not None:
        auth.user.avatar_url = body.avatar_url
    await db.commit()
    await db.refresh(auth.user)
    return auth.user


@router.post("/change-password")
async def change_password(
    body: ChangePasswordIn,
    auth: AuthContext = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    from app.core.exceptions import ValidationError
    from app.core.security import hash_password, verify_password

    if not auth.user.hashed_password or not verify_password(body.current_password, auth.user.hashed_password):
        raise ValidationError("Current password is incorrect")

    auth.user.hashed_password = hash_password(body.new_password)
    await db.commit()
    return {"message": "Password updated"}


@router.post("/workspace", status_code=201)
async def create_workspace(
    body: WorkspaceCreateIn,
    auth: AuthContext = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    svc = AuthService(db)
    tenant, access_token = await svc.create_workspace(auth.user, body.name, body.website_url or "", body.industry)
    return {
        "workspace": WorkspaceOut.model_validate(tenant),
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.post("/switch-workspace")
async def switch_workspace(
    body: SwitchTenantIn,
    auth: AuthContext = Depends(require_auth),
    db: AsyncSession = Depends(get_db),
):
    svc = AuthService(db)
    access_token = await svc.switch_tenant(auth.user, body.tenant_id)
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/workspaces")
async def list_workspaces(auth: AuthContext = Depends(require_auth), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.models.user import TenantMembership
    from app.models.tenant import Tenant

    result = await db.execute(
        select(Tenant)
        .join(TenantMembership, TenantMembership.tenant_id == Tenant.id)
        .where(TenantMembership.user_id == auth.user.id, TenantMembership.is_active == True)
    )
    tenants = result.scalars().all()
    return [WorkspaceOut.model_validate(t) for t in tenants]
