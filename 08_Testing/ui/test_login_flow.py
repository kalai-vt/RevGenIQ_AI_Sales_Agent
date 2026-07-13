"""Browser smoke test for the dashboard frontend, driven with Playwright.

Requires both the backend (FastAPI) and frontend (Vite dev server, which
proxies /api and /widget to the backend per vite.config.ts) to be running:

    # terminal 1
    cd 02_RevGenIQ_AI_Dashboard/backend && uvicorn main:app --port 8000

    # terminal 2
    cd 02_RevGenIQ_AI_Dashboard/frontend && npm run dev -- --port 3000

    # terminal 3
    BACKEND_URL=http://localhost:8000 pytest 08_Testing/ui --base-url http://localhost:3000
"""
import re

from playwright.sync_api import expect


def test_login_page_renders(page, base_url):
    page.goto(base_url + "/login")
    expect(page.get_by_role("heading", name=re.compile("welcome back", re.I))).to_be_visible()
    expect(page.locator("input[type=email]")).to_be_visible()
    expect(page.locator("input[type=password]")).to_be_visible()


def test_signup_link_navigates_to_signup(page, base_url):
    page.goto(base_url + "/login")
    page.get_by_role("link", name=re.compile("sign up|create", re.I)).click()
    page.wait_for_url(re.compile(r".*/signup"))
    expect(page.get_by_role("heading", name=re.compile("start for free", re.I))).to_be_visible()


def test_full_signup_login_dashboard_flow(page, base_url):
    # Use a fresh email — the `test_user` fixture pre-registers via the API,
    # which would make this exact signup attempt hit a 409 Conflict and never
    # navigate away from /signup.
    import uuid

    email = f"ui-signup-{uuid.uuid4().hex[:10]}@example.com"

    page.goto(base_url + "/signup")
    page.locator("input[type=text]").first.fill("UI Test User")
    page.locator("input[type=email]").fill(email)
    page.locator("input[type=password]").fill("UiTestPass123!")
    page.get_by_role("button", name=re.compile("create.*account", re.I)).click()

    # Successful signup auto-logs-in and redirects into onboarding (no workspace yet)
    page.wait_for_url(re.compile(r".*/(onboarding|dashboard)"), timeout=15000)


def test_login_with_wrong_password_shows_error(page, base_url, test_user):
    page.goto(base_url + "/login")
    page.locator("input[type=email]").fill(test_user["email"])
    page.locator("input[type=password]").fill("definitely-wrong")
    page.get_by_role("button", name=re.compile("log in|sign in", re.I)).click()

    # Toast error should appear; the app should NOT navigate away from /login
    expect(page.get_by_text(re.compile("invalid|credentials", re.I))).to_be_visible()
    assert "/login" in page.url
