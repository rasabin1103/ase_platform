"""Critical-path auth tests: register, login, /me. Kept to a handful of
calls since /auth/register (5/hour) and /auth/login (10/minute) are
rate-limited — every other test file authenticates via the super_admin_headers
/ independent_headers fixtures (a directly-minted JWT) instead of hitting
/auth/login, specifically to stay under that limit."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import RoleScope
from app.models.role import Role


@pytest.fixture(autouse=True)
def _no_turnstile(monkeypatch: pytest.MonkeyPatch) -> None:
    """Registration checks Cloudflare Turnstile when TURNSTILE_SECRET_KEY is
    configured (see app.core.turnstile.verify_turnstile_token) — which it is
    in this project's real .env, loaded automatically by pydantic-settings'
    env_file. None of these tests send a real Turnstile token, so without
    this override every /auth/register call here would 400 with
    "captcha_failed" the moment a developer has that key set locally."""
    monkeypatch.setattr(settings, "TURNSTILE_SECRET_KEY", None)


@pytest.fixture(autouse=True)
def _seed_independent_role(db: Session) -> None:
    """AuthService.register() calls ensure_personal_workspace(), which
    requires an 'independent_user' Role row to already exist (see
    app/core/creator.py's ValueError if it doesn't) — in a real deployment
    that comes from scripts/database/seed_roles.py, but conftest's `db`
    fixture TRUNCATEs every table (roles included) before each test, so it
    isn't there unless re-seeded here. Every other test file sidesteps this
    entirely via make_user_with_role(), which creates its own role rows on
    demand — this file is the one place that exercises real self-service
    registration end to end."""
    if db.query(Role).filter(Role.code == "independent_user").one_or_none() is None:
        db.add(Role(code="independent_user", name="Independent User", scope=RoleScope.personal_workspace))
        db.commit()


def test_register_then_login_returns_a_token_pair(client: TestClient):
    register_resp = client.post(
        "/api/v1/auth/register",
        # country is required on every signup (see RegisterRequest.country's
        # docstring) — and example.com, not example.test, since the latter
        # is an IANA special-use TLD that email-validator now rejects.
        json={"email": "newuser@example.com", "plain_password": "CorrectHorse123!", "country": "ES"},
    )
    assert register_resp.status_code == 201, register_resp.text
    assert register_resp.json()["email"] == "newuser@example.com"

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "newuser@example.com", "password": "CorrectHorse123!"},
    )
    assert login_resp.status_code == 200
    body = login_resp.json()
    assert "access_token" in body
    assert "refresh_token" in body


def test_login_with_wrong_password_is_rejected(client: TestClient):
    register_resp = client.post(
        "/api/v1/auth/register",
        json={"email": "wrongpass@example.com", "plain_password": "CorrectHorse123!", "country": "ES"},
    )
    # Without this, a broken registration would still leave this test
    # passing — a lookup for a nonexistent user is also a 401 below, so the
    # "wrong password" case wouldn't actually be the thing under test.
    assert register_resp.status_code == 201, register_resp.text

    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@example.com", "password": "not-the-password"},
    )
    assert resp.status_code == 401


def test_me_requires_authentication(client: TestClient):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_returns_the_authenticated_user(client: TestClient, super_admin_headers: dict[str, str]):
    resp = client.get("/api/v1/auth/me", headers=super_admin_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "admin@example.com"
    assert body["is_superuser"] is True
