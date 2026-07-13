def test_list_conversations_requires_auth(client):
    resp = client.get("/api/v1/conversations")
    assert resp.status_code == 401


def test_list_conversations_empty_for_fresh_tenant(client, tenant_headers):
    resp = client.get("/api/v1/conversations", headers=tenant_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_get_seeded_conversation_includes_messages(client, tenant_headers, seed_conversation):
    resp = client.get(f"/api/v1/conversations/{seed_conversation}", headers=tenant_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "active"
    assert body["messages"] == []


def test_get_conversation_not_found(client, tenant_headers):
    resp = client.get("/api/v1/conversations/00000000-0000-0000-0000-000000000000", headers=tenant_headers)
    assert resp.status_code == 404


def test_update_conversation_status_to_closed_sets_closed_at(client, tenant_headers, seed_conversation):
    resp = client.patch(
        f"/api/v1/conversations/{seed_conversation}", json={"status": "closed"}, headers=tenant_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"


def test_delete_conversation(client, tenant_headers, seed_conversation):
    resp = client.delete(f"/api/v1/conversations/{seed_conversation}", headers=tenant_headers)
    assert resp.status_code == 204

    resp = client.get(f"/api/v1/conversations/{seed_conversation}", headers=tenant_headers)
    assert resp.status_code == 404


def test_conversation_filter_by_status(client, tenant_headers, seed_conversation):
    resp = client.get("/api/v1/conversations", params={"status": "active"}, headers=tenant_headers)
    assert resp.status_code == 200
    assert any(c["id"] == str(seed_conversation) for c in resp.json())

    resp = client.get("/api/v1/conversations", params={"status": "closed"}, headers=tenant_headers)
    assert resp.status_code == 200
    assert all(c["id"] != str(seed_conversation) for c in resp.json())
