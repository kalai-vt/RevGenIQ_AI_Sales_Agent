from fastapi import HTTPException, status


class AppException(HTTPException):
    def __init__(self, status_code: int, detail: str, code: str | None = None):
        super().__init__(status_code=status_code, detail=detail)
        self.code = code


# ── Auth ──────────────────────────────────────────────────────────────────────
class NotAuthenticated(AppException):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail, "NOT_AUTHENTICATED")


class InvalidToken(AppException):
    def __init__(self, detail: str = "Invalid or expired token"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail, "INVALID_TOKEN")


class Forbidden(AppException):
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(status.HTTP_403_FORBIDDEN, detail, "FORBIDDEN")


class EmailNotVerified(AppException):
    def __init__(self):
        super().__init__(status.HTTP_403_FORBIDDEN, "Email not verified", "EMAIL_NOT_VERIFIED")


# ── Resources ─────────────────────────────────────────────────────────────────
class NotFound(AppException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(status.HTTP_404_NOT_FOUND, f"{resource} not found", "NOT_FOUND")


class Conflict(AppException):
    def __init__(self, detail: str):
        super().__init__(status.HTTP_409_CONFLICT, detail, "CONFLICT")


class ValidationError(AppException):
    def __init__(self, detail: str):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, detail, "VALIDATION_ERROR")


# ── Tenant ────────────────────────────────────────────────────────────────────
class TenantNotFound(AppException):
    def __init__(self):
        super().__init__(status.HTTP_404_NOT_FOUND, "Workspace not found", "TENANT_NOT_FOUND")


class TenantSuspended(AppException):
    def __init__(self):
        super().__init__(status.HTTP_403_FORBIDDEN, "Your workspace has been suspended", "TENANT_SUSPENDED")


# ── Billing ───────────────────────────────────────────────────────────────────
class PlanLimitExceeded(AppException):
    def __init__(self, resource: str):
        super().__init__(
            status.HTTP_402_PAYMENT_REQUIRED,
            f"Plan limit reached for {resource}. Please upgrade your plan.",
            "PLAN_LIMIT_EXCEEDED",
        )


class SubscriptionRequired(AppException):
    def __init__(self):
        super().__init__(
            status.HTTP_402_PAYMENT_REQUIRED,
            "An active subscription is required for this feature",
            "SUBSCRIPTION_REQUIRED",
        )
