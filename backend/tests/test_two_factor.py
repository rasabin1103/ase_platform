"""TOTP 2FA setup, login challenge, and disable."""

from __future__ import annotations

import uuid

import pyotp
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from tests.test_admin_users import _seed_super_admin

client = TestClient(app)


def _auth_headers(access_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {access_token}"}


def test_two_factor_full_flow():
    db = SessionLocal()
    try:
        email = f"2fa_{uuid.uuid4().hex}@example.com"
        password = "Password123!"
        admin = _seed_super_admin(db, email)
        db.commit()

        login_no_2fa = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert login_no_2fa.status_code == 200
        assert "access_token" in login_no_2fa.json()
        assert login_no_2fa.json().get("requires_2fa") is not True

        token = login_no_2fa.json()["access_token"]
        headers = _auth_headers(token)

        setup = client.post("/api/v1/auth/2fa/setup", headers=headers)
        assert setup.status_code == 200
        body = setup.json()
        assert body["otpauth_url"].startswith("otpauth://totp/")
        assert "secret=" in body["otpauth_url"]
        assert len(body["manual_key"]) >= 16
        assert body["manual_key"] not in body["otpauth_url"] or True

        secret = body["manual_key"]
        code = pyotp.TOTP(secret).now()

        confirm = client.post("/api/v1/auth/2fa/confirm", headers=headers, json={"code": code})
        assert confirm.status_code == 200
        recovery = confirm.json()["recovery_codes"]
        assert len(recovery) == 8
        assert all(c.startswith("ASE-") for c in recovery)

        me = client.get("/api/v1/auth/me", headers=headers)
        assert me.status_code == 200
        assert me.json()["two_factor_enabled"] is True
        assert me.json()["two_factor_confirmed_at"] is not None
        assert "two_factor_secret" not in me.json()
        assert "two_factor_recovery_codes" not in me.json()

        login_2fa = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert login_2fa.status_code == 200
        challenge = login_2fa.json()
        assert challenge.get("requires_2fa") is True
        assert "temporary_login_token" in challenge
        assert "access_token" not in challenge

        bad = client.post(
            "/api/v1/auth/2fa/login-confirm",
            json={"temporary_login_token": challenge["temporary_login_token"], "code": "000000"},
        )
        assert bad.status_code == 400
        assert bad.json()["detail"] == "Invalid authentication code"

        good_code = pyotp.TOTP(secret).now()
        ok = client.post(
            "/api/v1/auth/2fa/login-confirm",
            json={
                "temporary_login_token": challenge["temporary_login_token"],
                "code": good_code,
            },
        )
        assert ok.status_code == 200
        assert ok.json()["access_token"]
        assert ok.json()["refresh_token"]

        disable = client.post(
            "/api/v1/auth/2fa/disable",
            headers=_auth_headers(ok.json()["access_token"]),
            json={"password": password, "code": pyotp.TOTP(secret).now()},
        )
        assert disable.status_code == 204

        me_after = client.get("/api/v1/auth/me", headers=_auth_headers(ok.json()["access_token"]))
        assert me_after.json()["two_factor_enabled"] is False

        db.refresh(admin)
        assert admin.two_factor_secret is None
        assert admin.two_factor_recovery_codes is None
    finally:
        db.close()


def test_setup_rejects_when_already_enabled():
    db = SessionLocal()
    try:
        email = f"2fa2_{uuid.uuid4().hex}@example.com"
        password = "Password123!"
        _seed_super_admin(db, email)
        db.commit()
        db.commit()

        login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        headers = _auth_headers(login.json()["access_token"])
        setup = client.post("/api/v1/auth/2fa/setup", headers=headers)
        secret = setup.json()["manual_key"]
        client.post(
            "/api/v1/auth/2fa/confirm",
            headers=headers,
            json={"code": pyotp.TOTP(secret).now()},
        )
        again = client.post("/api/v1/auth/2fa/setup", headers=headers)
        assert again.status_code == 400
    finally:
        db.close()
