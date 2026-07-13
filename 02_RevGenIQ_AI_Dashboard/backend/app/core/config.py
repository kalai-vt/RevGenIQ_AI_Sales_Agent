from functools import lru_cache
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # App
    APP_NAME: str = "RevGenIQ AI"
    APP_ENV: Literal["development", "staging", "production"] = "development"
    APP_DEBUG: bool = False
    APP_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"
    SECRET_KEY: str = "change-me-in-production"

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    WIDGET_SESSION_EXPIRE_MINUTES: int = 60

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://agentsaas:agentsaas_secret@localhost:5432/agentsaas"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 40

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Qdrant
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""

    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_DEFAULT_MODEL: str = "gpt-4o-mini"
    EMBEDDING_DIMENSIONS: int = 1536

    # Storage
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_MB: int = 50

    # Email
    SMTP_HOST: str = ""
    SMTP_PORT: int = 465
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@revgeniq.ai"
    EMAIL_FROM_NAME: str = "RevGenIQ AI"

    # Social Auth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    # Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # Knowledge chunking
    MAX_CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    WIDGET_RATE_LIMIT_PER_MINUTE: int = 120

    # Sentry
    SENTRY_DSN: str = ""

    # Scheduled re-crawl (Vercel Cron calls this with this bearer secret)
    CRON_SECRET: str = ""

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [self.FRONTEND_URL, "http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "http://127.0.0.1:8080"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
