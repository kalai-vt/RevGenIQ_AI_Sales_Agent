import os
import uuid

import pytest
import requests


BACKEND_URL = os.environ.get("BACKEND_URL", "http://127.0.0.1:8020")


@pytest.fixture
def test_user():
    email = f"ui-{uuid.uuid4().hex[:10]}@example.com"
    password = "UiTestPass123!"
    resp = requests.post(
        f"{BACKEND_URL}/api/v1/auth/register",
        json={"full_name": "UI Test User", "email": email, "password": password},
        timeout=10,
    )
    resp.raise_for_status()
    return {"email": email, "password": password}
