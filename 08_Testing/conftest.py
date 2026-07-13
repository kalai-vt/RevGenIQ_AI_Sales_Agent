"""Shared test setup for the whole 08_Testing suite.

Points the backend at an isolated SQLite file (never the dev `agentdb.db`)
and puts `02_RevGenIQ_AI_Dashboard/backend` on sys.path so `import main` /
`import app...` resolve the same way they do when the server runs for real.
"""
import os
import sys
import pathlib

_ROOT = pathlib.Path(__file__).resolve().parent.parent
_BACKEND_DIR = _ROOT / "02_RevGenIQ_AI_Dashboard" / "backend"
_TEST_DB = pathlib.Path(__file__).resolve().parent / "_test_data" / "test.db"
_TEST_DB.parent.mkdir(exist_ok=True)

if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TEST_DB.as_posix()}"
os.environ["JWT_SECRET_KEY"] = "test-suite-secret-key"
os.environ["SECRET_KEY"] = "test-suite-secret-key"
os.environ["APP_DEBUG"] = "false"
os.environ["APP_ENV"] = "development"
os.environ["UPLOAD_DIR"] = str((pathlib.Path(__file__).resolve().parent / "_test_data" / "uploads"))

# ── Shared fixtures (available to api/tests and integration) ──────────────────
import uuid

import pytest
from fastapi.testclient import TestClient
from jose import jwt as jose_jwt

import main as backend_main
from app.core.config import settings


@pytest.fixture(scope="session")
def client():
    with TestClient(backend_main.app) as c:
        yield c


@pytest.fixture
def registered_user(client):
    email = f"user-{uuid.uuid4().hex[:12]}@example.com"
    password = "TestPass123!"
    resp = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Test User", "email": email, "password": password},
    )
    assert resp.status_code == 201, resp.text
    return {"email": email, "password": password, "user_id": resp.json()["user_id"]}


@pytest.fixture
def auth_token(client, registered_user):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


@pytest.fixture
def auth_headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def tenant_token(client, auth_headers):
    resp = client.post(
        "/api/v1/auth/workspace",
        json={"name": f"Test Co {uuid.uuid4().hex[:6]}"},
        headers=auth_headers,
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["access_token"]


@pytest.fixture
def tenant_headers(tenant_token):
    return {"Authorization": f"Bearer {tenant_token}"}


@pytest.fixture
def tenant_id(tenant_token):
    payload = jose_jwt.decode(tenant_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    return payload["tenant_id"]


@pytest.fixture
async def seed_conversation(tenant_id):
    """Insert a Conversation directly via the ORM (no public create-conversation endpoint exists)."""
    import uuid as uuid_lib
    from app.db.session import AsyncSessionLocal
    from app.models.conversation import Conversation, ConversationStatus

    async with AsyncSessionLocal() as db:
        conv = Conversation(
            tenant_id=uuid_lib.UUID(tenant_id),
            visitor_id=f"visitor-{uuid_lib.uuid4().hex[:8]}",
            session_token=str(uuid_lib.uuid4()),
            status=ConversationStatus.active,
            page_url="https://example.com/pricing",
        )
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        return conv.id


@pytest.fixture
async def seed_lead(tenant_id, seed_conversation):
    import uuid as uuid_lib
    from app.db.session import AsyncSessionLocal
    from app.models.lead import Lead, LeadPriority, LeadStatus

    async with AsyncSessionLocal() as db:
        lead = Lead(
            tenant_id=uuid_lib.UUID(tenant_id),
            conversation_id=seed_conversation,
            name="Jane Doe",
            email=f"jane-{uuid_lib.uuid4().hex[:8]}@acme.com",
            company_name="Acme",
            status=LeadStatus.new,
            priority=LeadPriority.high,
            source="chat",
        )
        db.add(lead)
        await db.commit()
        await db.refresh(lead)
        return lead.id
