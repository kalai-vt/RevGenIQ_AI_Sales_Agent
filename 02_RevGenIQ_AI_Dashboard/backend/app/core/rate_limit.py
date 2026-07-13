"""
Postgres-backed rate limiting.

An in-memory limiter (the original slowapi-based approach) doesn't actually
work on Vercel's serverless Python runtime — verified live: 25 rapid requests
against a 20/minute limit all returned 200 with no rate-limit headers at all,
because in-memory state doesn't reliably persist between invocations there.
This uses the database that's already reliably available instead — one
UPSERT per request, portable across Postgres and SQLite without a branch.
"""
import time
from fastapi import Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

_TABLE_READY = False


async def _ensure_table(db: AsyncSession) -> None:
    global _TABLE_READY
    if _TABLE_READY:
        return
    await db.execute(text(
        "CREATE TABLE IF NOT EXISTS rate_limit_buckets ("
        "bucket_key VARCHAR(255) NOT NULL, "
        "window_start BIGINT NOT NULL, "
        "count INTEGER NOT NULL DEFAULT 0, "
        "PRIMARY KEY (bucket_key, window_start))"
    ))
    _TABLE_READY = True


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(name: str, limit: int, window_seconds: int = 60):
    """FastAPI dependency factory: Depends(rate_limit("init", 20)).
    Keyed by client IP + route name; raises 429 once the count for the
    current time window exceeds `limit`."""

    async def _dependency(request: Request, db: AsyncSession = Depends(get_db)) -> None:
        await _ensure_table(db)
        window_start = int(time.time()) // window_seconds * window_seconds
        bucket_key = f"{name}:{_client_ip(request)}"

        result = await db.execute(
            text(
                "INSERT INTO rate_limit_buckets (bucket_key, window_start, count) "
                "VALUES (:key, :window, 1) "
                "ON CONFLICT (bucket_key, window_start) DO UPDATE SET count = rate_limit_buckets.count + 1 "
                "RETURNING count"
            ),
            {"key": bucket_key, "window": window_start},
        )
        count = result.scalar_one()
        await db.commit()

        # Opportunistic cleanup so this table doesn't grow unbounded — no
        # separate cron job needed at current scale.
        if count == 1 and hash(bucket_key) % 50 == 0:
            cutoff = window_start - window_seconds * 10
            await db.execute(text("DELETE FROM rate_limit_buckets WHERE window_start < :cutoff"), {"cutoff": cutoff})
            await db.commit()

        if count > limit:
            raise HTTPException(status_code=429, detail="Too many requests — please slow down and try again shortly.")

    return _dependency
