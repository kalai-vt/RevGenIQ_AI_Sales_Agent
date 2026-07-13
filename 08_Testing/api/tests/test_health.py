def test_health_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_root_ok(client):
    resp = client.get("/")
    assert resp.status_code == 200
    assert "docs" in resp.json()


def test_openapi_lists_all_routers(client):
    schema = client.get("/openapi.json").json()
    paths = schema["paths"]
    for expected in (
        "/api/v1/auth/login",
        "/api/v1/analytics/summary",
        "/api/v1/knowledge/sources",
        "/api/v1/leads",
        "/api/v1/conversations",
        "/api/v1/billing/plans",
        "/widget/v1/chat",
    ):
        assert expected in paths, f"missing route: {expected}"
