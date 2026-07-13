"""Unit tests for app.core.security — password hashing and JWT helpers.

No DB, no network — pure function tests.
"""
import pytest
from jose import JWTError

from app.core.security import (
    create_access_token,
    decode_access_token,
    decode_refresh_token,
    create_refresh_token,
    hash_password,
    verify_password,
)


def test_password_hash_and_verify_roundtrip():
    hashed = hash_password("Sup3rSecret!")
    assert hashed != "Sup3rSecret!"
    assert verify_password("Sup3rSecret!", hashed)


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("Sup3rSecret!")
    assert not verify_password("wrong-password", hashed)


def test_access_token_roundtrip_contains_tenant():
    token = create_access_token(user_id="abc-123", tenant_id="tenant-456")
    payload = decode_access_token(token)
    assert payload["sub"] == "abc-123"
    assert payload["tenant_id"] == "tenant-456"
    assert payload["kind"] == "access"


def test_access_token_without_tenant_has_no_tenant_claim():
    token = create_access_token(user_id="abc-123")
    payload = decode_access_token(token)
    assert "tenant_id" not in payload


def test_refresh_token_rejected_by_access_decoder():
    token = create_refresh_token(user_id="abc-123")
    with pytest.raises(JWTError):
        decode_access_token(token)


def test_decode_rejects_tampered_token():
    token = create_access_token(user_id="abc-123")
    tampered = token[:-4] + ("aaaa" if not token.endswith("aaaa") else "bbbb")
    with pytest.raises(JWTError):
        decode_access_token(tampered)
