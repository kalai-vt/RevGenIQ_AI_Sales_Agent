import uuid


def test_register_creates_account(client):
    email = f"reg-{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Reg User", "email": email, "password": "TestPass123!"},
    )
    assert resp.status_code == 201
    assert "user_id" in resp.json()


def test_register_duplicate_email_conflicts(client, registered_user):
    resp = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Dup", "email": registered_user["email"], "password": "AnotherPass1!"},
    )
    assert resp.status_code == 409


def test_register_rejects_short_password(client):
    resp = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Short Pw", "email": f"short-{uuid.uuid4().hex[:8]}@example.com", "password": "short"},
    )
    assert resp.status_code == 422


def test_login_wrong_password_rejected(client, registered_user):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": "wrong-password"},
    )
    assert resp.status_code == 401


def test_login_unknown_email_rejected(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody-here@example.com", "password": "whatever123"},
    )
    assert resp.status_code == 401


def test_login_returns_tokens(client, registered_user):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": registered_user["email"], "password": registered_user["password"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body and "refresh_token" in body


def test_me_requires_auth(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_returns_current_user(client, auth_headers, registered_user):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == registered_user["email"]


def test_create_workspace_returns_tenant_scoped_token(client, auth_headers):
    resp = client.post("/api/v1/auth/workspace", json={"name": "My Workspace"}, headers=auth_headers)
    assert resp.status_code == 201
    body = resp.json()
    assert body["workspace"]["name"] == "My Workspace"
    assert "access_token" in body


def test_list_workspaces_after_creation(client, auth_headers, tenant_headers):
    resp = client.get("/api/v1/auth/workspaces", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) >= 1
