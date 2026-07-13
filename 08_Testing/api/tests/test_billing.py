def test_plans_are_public_no_auth_required(client):
    resp = client.get("/api/v1/billing/plans")
    assert resp.status_code == 200
    slugs = {p["slug"] for p in resp.json()}
    assert {"starter", "business"} <= slugs


def test_subscription_requires_auth(client):
    resp = client.get("/api/v1/billing/subscription")
    assert resp.status_code == 401


def test_subscription_not_found_for_tenant_without_one(client, tenant_headers):
    resp = client.get("/api/v1/billing/subscription", headers=tenant_headers)
    assert resp.status_code == 404


def test_invoices_empty_for_fresh_tenant(client, tenant_headers):
    resp = client.get("/api/v1/billing/invoices", headers=tenant_headers)
    assert resp.status_code == 200
    assert resp.json() == []


def test_cancel_subscription_lifecycle(client, tenant_headers, tenant_id):
    import uuid as uuid_lib
    import asyncio

    from app.db.session import AsyncSessionLocal
    from app.models.billing import BillingCycle, Plan, Subscription, SubscriptionStatus
    from sqlalchemy import select

    async def _seed():
        async with AsyncSessionLocal() as db:
            plan = (await db.execute(select(Plan).where(Plan.slug == "starter"))).scalar_one()
            sub = Subscription(
                tenant_id=uuid_lib.UUID(tenant_id),
                plan_id=plan.id,
                status=SubscriptionStatus.trialing,
                billing_cycle=BillingCycle.monthly,
            )
            db.add(sub)
            await db.commit()

    asyncio.run(_seed())

    resp = client.get("/api/v1/billing/subscription", headers=tenant_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "trialing"
    assert resp.json()["plan"]["slug"] == "starter"

    resp = client.post("/api/v1/billing/subscription/cancel", headers=tenant_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "canceled"

    resp = client.get("/api/v1/billing/subscription", headers=tenant_headers)
    assert resp.json()["status"] == "canceled"
