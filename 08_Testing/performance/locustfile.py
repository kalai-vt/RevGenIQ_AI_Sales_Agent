"""Load test for the RevGenIQ AI Dashboard backend.

Not run as part of the automated test suite (a real load test needs a
dedicated target environment, not the dev SQLite DB). To run manually:

    pip install locust
    locust -f 08_Testing/performance/locustfile.py --host http://localhost:8000

Then open http://localhost:8089 to configure user count / spawn rate.
"""
import uuid

from locust import HttpUser, between, task


class DashboardUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        email = f"loadtest-{uuid.uuid4().hex[:10]}@example.com"
        password = "LoadTestPass123!"
        self.client.post(
            "/api/v1/auth/register",
            json={"full_name": "Load Test", "email": email, "password": password},
        )
        resp = self.client.post("/api/v1/auth/login", json={"email": email, "password": password})
        self.access_token = resp.json().get("access_token", "")
        workspace = self.client.post(
            "/api/v1/auth/workspace",
            json={"name": f"Load Co {uuid.uuid4().hex[:6]}"},
            headers=self._auth_headers(),
        )
        self.tenant_token = workspace.json().get("access_token", self.access_token)

    def _auth_headers(self):
        return {"Authorization": f"Bearer {self.access_token}"}

    def _tenant_headers(self):
        return {"Authorization": f"Bearer {self.tenant_token}"}

    @task(5)
    def health(self):
        self.client.get("/health")

    @task(3)
    def list_plans(self):
        self.client.get("/api/v1/billing/plans")

    @task(3)
    def list_leads(self):
        self.client.get("/api/v1/leads", headers=self._tenant_headers())

    @task(2)
    def analytics_summary(self):
        self.client.get("/api/v1/analytics/summary", headers=self._tenant_headers())

    @task(1)
    def widget_health(self):
        self.client.get("/widget/v1/health")
