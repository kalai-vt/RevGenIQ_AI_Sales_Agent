import logging
import os
import sys
from contextlib import asynccontextmanager

# Add revgeniq_agent (03_) to Python path
_MONOREPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_AGENT_PKG = os.path.join(_MONOREPO_ROOT, "03_RevGenIQ_AI_Sales_Marketing_Agent")
if _AGENT_PKG not in sys.path:
    sys.path.insert(0, _AGENT_PKG)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exceptions import AppException
from app.middleware.tenant import TenantMiddleware
from app.middleware.widget_cors import WidgetCORSMiddleware

logging.basicConfig(
    level=logging.DEBUG if settings.APP_DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    try:
        from app.db.session import create_tables
        await create_tables()
        logger.info("Database tables ready")
    except Exception as exc:
        logger.warning("DB init failed: %s", exc)

    try:
        from app.db.session import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            await _seed_plans(db)
            await db.commit()
            logger.info("Plans synced")
    except Exception as exc:
        logger.warning("Plan seeding failed: %s", exc)

    try:
        from app.db.session import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            await _ensure_vector_search(db)
            await db.commit()
            logger.info("pgvector search ready")
    except Exception as exc:
        logger.warning("pgvector setup failed (falling back to keyword search): %s", exc)

    yield
    logger.info("RevGenIQ AI Dashboard shutting down")


async def _ensure_vector_search(db):
    """Idempotent setup for real semantic search on Postgres: the pgvector
    extension, an `embedding` column on knowledge_chunks, and an ANN index.
    Skipped entirely on SQLite (local dev), which uses a keyword-only fallback
    — see revgeniq_agent/embeddings. Safe to run on every startup: every
    statement is a no-op if already applied."""
    from sqlalchemy import text
    from app.db.session import _is_sqlite
    if _is_sqlite:
        return

    await db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    await db.execute(text(
        f"ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector({settings.EMBEDDING_DIMENSIONS})"
    ))

    # Website Knowledge Engine metadata columns (see app/models/knowledge.py)
    # — additive, on the pre-existing knowledge_chunks table.
    for column, coltype in [
        ("page_id", "UUID"), ("page_url", "VARCHAR(1000)"),
        ("page_title", "VARCHAR(500)"), ("source_type", "VARCHAR(20)"),
    ]:
        await db.execute(text(f"ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS {column} {coltype}"))

    # Visitor-session enrichment columns (see app/models/conversation.py) —
    # additive, so existing rows just read back NULL for these until the
    # visitor's next conversation is created via the new /widget/v1/init flow.
    for column, coltype in [
        ("browser", "VARCHAR(50)"), ("device_type", "VARCHAR(20)"), ("os", "VARCHAR(50)"),
        ("timezone", "VARCHAR(50)"), ("referrer", "VARCHAR(500)"),
    ]:
        await db.execute(text(f"ALTER TABLE conversations ADD COLUMN IF NOT EXISTS {column} {coltype}"))

    try:
        # Nested transaction (SAVEPOINT): if older pgvector doesn't support
        # HNSW, this rolls back just the index attempt — not the extension
        # and column changes above, which must still commit either way.
        async with db.begin_nested():
            await db.execute(text(
                "CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx "
                "ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)"
            ))
    except Exception as exc:
        logger.warning("Could not create HNSW index (search still works, just unindexed): %s", exc)


async def _seed_plans(db):
    """Create-or-update the standard plans by slug — an upsert rather than a
    seed-if-empty check, so changing prices/limits here also fixes tenants'
    plans already seeded in a live database, not just brand-new ones."""
    from app.models.billing import Plan
    from sqlalchemy import select

    defs = [
        dict(name="Starter",  slug="starter",  description="Perfect for small businesses getting started with AI",
             price_monthly=1999, price_yearly=19990, max_conversations=2000,  max_leads=1000,  max_users=3,  max_knowledge_mb=100,  sort_order=1,
             features={"ai_responses": True, "widget_builder": True}),
        dict(name="Growth",   slug="growth",   description="For growing teams that need more scale and insight",
             price_monthly=3999, price_yearly=39990, max_conversations=15000, max_leads=5000,  max_users=10, max_knowledge_mb=500,  sort_order=2,
             features={"ai_responses": True, "widget_builder": True, "analytics": True, "team": True}),
        dict(name="Business", slug="business", description="Maximum scale and access for teams that need everything",
             price_monthly=5999, price_yearly=59990, max_conversations=-1,    max_leads=-1,    max_users=-1, max_knowledge_mb=2000, sort_order=3,
             features={"ai_responses": True, "widget_builder": True, "analytics": True, "team": True, "api_access": True, "white_label": True, "priority_support": True}),
    ]
    for d in defs:
        existing = (await db.execute(select(Plan).where(Plan.slug == d["slug"]))).scalar_one_or_none()
        if existing:
            for field, value in d.items():
                setattr(existing, field, value)
        else:
            db.add(Plan(**d))
    await db.flush()


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="RevGenIQ AI Dashboard",
    description="RevGenIQ AI — Sales & Marketing Agent Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# ── Middleware (order matters — outermost = first) ────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(TenantMiddleware)
app.add_middleware(WidgetCORSMiddleware)

# ── Routers ───────────────────────────────────────────────────────────────────

from app.api.v1.auth import router as auth_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.knowledge import router as knowledge_router
from app.api.v1.leads import router as leads_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.billing import router as billing_router
from app.api.v1.widget_settings import router as widget_settings_router
from app.api.v1.ai_config import router as ai_config_router
from app.api.v1.team import router as team_router
from app.api.v1.workspace import router as workspace_router
from app.api.v1.cron import router as cron_router
from app.widget.router import router as widget_router

app.include_router(auth_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")
app.include_router(knowledge_router, prefix="/api/v1")
app.include_router(leads_router, prefix="/api/v1")
app.include_router(conversations_router, prefix="/api/v1")
app.include_router(billing_router, prefix="/api/v1")
app.include_router(widget_settings_router, prefix="/api/v1")
app.include_router(ai_config_router, prefix="/api/v1")
app.include_router(team_router, prefix="/api/v1")
app.include_router(workspace_router, prefix="/api/v1")
app.include_router(cron_router)
app.include_router(widget_router)


# ── Exception handlers ────────────────────────────────────────────────────────

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": getattr(exc, "code", None)},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
async def health():
    return {"status": "healthy", "version": "1.0.0", "app": settings.APP_NAME}


@app.get("/", tags=["system"])
async def root():
    return {"app": settings.APP_NAME, "docs": "/docs"}
