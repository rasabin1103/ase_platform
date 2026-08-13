"""Critical-path auth tests: register, login, /me. Kept to a handful of
calls since /auth/register (5/hour) and /auth/login (10/minute) are
rate-limited — every other test file authenticates via the super_admin_headers
/ independent_headers fixtures (a directly-minted JWT) instead of hitting
/auth/login, specifically to stay under that limit."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_register_then_login_returns_a_token_pair(client: TestClient):
    register_resp = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.test", "plain_password": "CorrectHorse123!"},
    )
    assert register_resp.status_code == 201
    assert register_resp.json()["email"] == "newuser@example.test"

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "newuser@example.test", "password": "CorrectHorse123!"},
    )
    assert login_resp.status_code == 200
    body = login_resp.json()
    assert "access_token" in body
    assert "refresh_token" in body


def test_login_with_wrong_password_is_rejected(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpass@example.test", "plain_password": "CorrectHorse123!"},
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@example.test", "password": "not-the-password"},
    )
    assert resp.status_code == 401


def test_me_requires_authentication(client: TestClient):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_returns_the_authenticated_user(client: TestClient, super_admin_headers: dict[str, str]):
    resp = client.get("/api/v1/auth/me", headers=super_admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "admin@example.test"
    assert body["is_superuser"] is True
