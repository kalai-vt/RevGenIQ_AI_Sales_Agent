"""End-to-end flow: signup -> workspace -> lead capture -> triage -> analytics.

Exercises auth, leads, conversations, and analytics routers together against
a single running app instance, the way a real dashboard session would.
"""


def test_full_lead_lifecycle_reflected_in_analytics(client, tenant_headers, seed_lead):
    # 1. The lead exists and starts as "new"
    resp = client.get(f"/api/v1/leads/{seed_lead}", headers=tenant_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "new"

    # 2. Sales rep triages it: mark qualified, log a call
    resp = client.patch(f"/api/v1/leads/{seed_lead}", json={"status": "qualified"}, headers=tenant_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "qualified"

    resp = client.post(
        f"/api/v1/leads/{seed_lead}/activities",
        json={"activity_type": "call", "content": "Discussed pricing"},
        headers=tenant_headers,
    )
    assert resp.status_code == 201

    # 3. Lead funnel analytics reflects the qualified lead
    resp = client.get("/api/v1/analytics/lead-funnel", headers=tenant_headers)
    assert resp.status_code == 200
    funnel = {row["status"]: row["count"] for row in resp.json()}
    assert funnel["qualified"] == 1
    assert funnel["new"] == 0

    # 4. Overall summary counts the lead and its source conversation
    resp = client.get("/api/v1/analytics/summary", headers=tenant_headers)
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["leads"] == 1
    assert summary["conversations"] == 1

    # 5. Top-pages reflects the conversation's page_url
    resp = client.get("/api/v1/analytics/top-pages", headers=tenant_headers)
    assert resp.status_code == 200
    assert any(row["url"] == "https://example.com/pricing" for row in resp.json())


def test_deleting_lead_does_not_affect_conversation(client, tenant_headers, seed_lead, seed_conversation):
    resp = client.delete(f"/api/v1/leads/{seed_lead}", headers=tenant_headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/v1/conversations/{seed_conversation}", headers=tenant_headers)
    assert resp.status_code == 200


def test_signup_to_first_workspace_end_to_end(client):
    import uuid

    email = f"flow-{uuid.uuid4().hex[:10]}@example.com"
    password = "FlowPass123!"

    register = client.post(
        "/api/v1/auth/register", json={"full_name": "Flow User", "email": email, "password": password}
    )
    assert register.status_code == 201

    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    access_token = login.json()["access_token"]

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email

    workspace = client.post(
        "/api/v1/auth/workspace",
        json={"name": "Flow Co"},
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert workspace.status_code == 201
    tenant_token = workspace.json()["access_token"]

    # Fresh workspace: everything starts empty but reachable
    leads = client.get("/api/v1/leads", headers={"Authorization": f"Bearer {tenant_token}"})
    assert leads.status_code == 200 and leads.json() == []

    plans = client.get("/api/v1/billing/plans")
    assert plans.status_code == 200 and len(plans.json()) >= 2
