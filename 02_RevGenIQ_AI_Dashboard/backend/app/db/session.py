from urllib.parse import urlparse, parse_qs, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")


def _normalize_postgres_url(url: str) -> tuple[str, dict]:
    """Managed Postgres providers (Neon, Heroku, etc.) hand out
    `postgres://...?sslmode=require` — the plain `postgres://` scheme needs
    the `+asyncpg` driver marker, and asyncpg's URL parser doesn't understand
    libpq query params like `sslmode`/`channel_binding`, so those are
    stripped and passed via connect_args instead."""
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]

    connect_args: dict = {}
    parsed = urlparse(url)
    if parsed.query:
        qs = parse_qs(parsed.query)
        if "sslmode" in qs or "channel_binding" in qs:
            connect_args["ssl"] = "require"
        url = urlunparse(parsed._replace(query=""))
    return url, connect_args


_connect_args: dict = {}
if _is_sqlite:
    _db_url = settings.DATABASE_URL
else:
    _db_url, _connect_args = _normalize_postgres_url(settings.DATABASE_URL)

engine = create_async_engine(
    _db_url,
    echo=settings.APP_DEBUG,
    connect_args=_connect_args,
    **({} if _is_sqlite else {
        "pool_size": settings.DATABASE_POOL_SIZE,
        "max_overflow": settings.DATABASE_MAX_OVERFLOW,
        "pool_pre_ping": True,
        "pool_recycle": 3600,
    })
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables() -> None:
    from app.db.base import Base
    import app.models  # noqa: F401 — registers all models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
