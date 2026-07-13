def test_list_leads_requires_auth(client):
    resp = client.get("/api/v1/leads")
    assert resp.status_code == 401


def test_list_leads_empty_for_fresh_tenant(client, tenant_headers):
    resp = client.get("/api/v1/leads", headers=tenant_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_lead_stats_empty_for_fresh_tenant(client, tenant_headers):
    resp = client.get("/api/v1/leads/stats", headers=tenant_headers)
    assert resp.status_code == 200
    assert resp.json() == {"total": 0, "high_priority": 0, "avg_score": 0.0}


def test_get_seeded_lead(client, tenant_headers, seed_lead):
    resp = client.get(f"/api/v1/leads/{seed_lead}", headers=tenant_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Jane Doe"
    assert body["status"] == "new"
    assert body["priority"] == "high"


def test_get_lead_not_found(client, tenant_headers):
    resp = client.get("/api/v1/leads/00000000-0000-0000-0000-000000000000", headers=tenant_headers)
    assert resp.status_code == 404


def test_update_lead_status(client, tenant_headers, seed_lead):
    resp = client.patch(
        f"/api/v1/leads/{seed_lead}", json={"status": "qualified"}, headers=tenant_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "qualified"


def test_lead_appears_in_list_after_seeding(client, tenant_headers, seed_lead):
    resp = client.get("/api/v1/leads", headers=tenant_headers)
    assert resp.status_code == 200
    ids = [item["id"] for item in resp.json()]
    assert str(seed_lead) in ids


def test_create_and_list_lead_activity(client, tenant_headers, seed_lead):
    resp = client.post(
        f"/api/v1/leads/{seed_lead}/activities",
        json={"activity_type": "note", "content": "Called, interested"},
        headers=tenant_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["content"] == "Called, interested"

    resp = client.get(f"/api/v1/leads/{seed_lead}/activities", headers=tenant_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_delete_lead(client, tenant_headers, seed_lead):
    resp = client.delete(f"/api/v1/leads/{seed_lead}", headers=tenant_headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/v1/leads/{seed_lead}", headers=tenant_headers)
    assert resp.status_code == 404


def test_lead_from_other_tenant_is_invisible(client, tenant_headers, seed_lead):
    """A second, unrelated tenant must not see the first tenant's lead."""
    other_register = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Other Owner", "email": "other-tenant-owner@example.com", "password": "TestPass123!"},
    )
    assert other_register.status_code == 201
    other_login = client.post(
        "/api/v1/auth/login",
        json={"email": "other-tenant-owner@example.com", "password": "TestPass123!"},
    )
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}
    other_workspace = client.post("/api/v1/auth/workspace", json={"name": "Other Co"}, headers=other_headers)
    other_tenant_headers = {"Authorization": f"Bearer {other_workspace.json()['access_token']}"}

    resp = client.get(f"/api/v1/leads/{seed_lead}", headers=other_tenant_headers)
    assert resp.status_code == 404
