"""Unit tests for app.services.lead_service.LeadService.

Uses a throwaway in-memory SQLite engine per test — isolated from the
shared test.db used by the API test suite.
"""
import uuid

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.models  # noqa: F401 — registers all models on Base.metadata
from app.db.base import Base
from app.services.lead_service import LeadService


@pytest.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await engine.dispose()


async def test_create_lead_creates_new_record(db_session):
    tenant_id = str(uuid.uuid4())
    service = LeadService(db_session)
    lead = await service.create_or_update_lead(
        tenant_id, None, {"name": "Alice", "email": "alice@example.com"}
    )
    await db_session.commit()

    assert lead.name == "Alice"
    assert lead.email == "alice@example.com"
    assert lead.status.value == "new"
    assert lead.priority.value == "medium"


async def test_create_lead_updates_existing_by_email(db_session):
    tenant_id = str(uuid.uuid4())
    service = LeadService(db_session)

    first = await service.create_or_update_lead(tenant_id, None, {"name": "Bob", "email": "bob@example.com"})
    await db_session.commit()

    second = await service.create_or_update_lead(
        tenant_id, None, {"name": "Bob Updated", "email": "bob@example.com", "company_name": "Acme"}
    )
    await db_session.commit()

    assert first.id == second.id
    assert second.name == "Bob Updated"
    assert second.company_name == "Acme"


async def test_leads_are_isolated_by_tenant(db_session):
    tenant_a, tenant_b = str(uuid.uuid4()), str(uuid.uuid4())
    service = LeadService(db_session)

    await service.create_or_update_lead(tenant_a, None, {"name": "A", "email": "a@x.com"})
    await service.create_or_update_lead(tenant_b, None, {"name": "B", "email": "b@x.com"})
    await db_session.commit()

    leads_a = await service.get_leads(tenant_a, {})
    leads_b = await service.get_leads(tenant_b, {})

    assert len(leads_a) == 1 and leads_a[0].email == "a@x.com"
    assert len(leads_b) == 1 and leads_b[0].email == "b@x.com"


async def test_get_lead_stats_counts_high_priority(db_session):
    from app.models.lead import LeadPriority

    tenant_id = str(uuid.uuid4())
    service = LeadService(db_session)
    lead = await service.create_or_update_lead(tenant_id, None, {"name": "A", "email": "a@x.com"})
    lead.priority = LeadPriority.high
    await db_session.commit()

    stats = await service.get_lead_stats(tenant_id)
    assert stats["total"] == 1
    assert stats["high_priority"] == 1
