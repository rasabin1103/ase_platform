from __future__ import annotations

import secrets

import pyotp
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models.enums import UserStatus
from app.models.user import User
from app.modules.auth.security import hash_password


def _register_active_user(db) -> tuple[User, str]:
    email = f"twofa_{secrets.token_hex(6)}@example.com"
    password = "Password123!"
    user = User(email=email, password_hash=hash_password(password), status=UserStatus.active)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, password


def _login(client: TestClient, *, email: str, password: str) -> dict:
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()


def test_setup_confirm_and_login_with_two_factor_flow():
    db = SessionLocal()
    try:
        user, password = _register_active_user(db)
        client = TestClient(app)

        # Plain login before 2FA is enabled — tokens issued directly.
        body = _login(client, email=user.email, password=password)
        assert "access_token" in body and "two_factor_required" not in body
        access_token = body["access_token"]

        # Start setup.
        setup_res = client.post(
            "/api/v1/auth/2fa/setup", headers={"Authorization": f"Bearer {access_token}"},
        )
        assert setup_res.status_code == 200, setup_res.text
        setup_body = setup_res.json()
        assert setup_body["secret"]
        assert setup_body["otpauth_uri"].startswith("otpauth://totp/")
        assert setup_body["qr_code_data_uri"].startswith("data:image/png;base64,")

        secret = setup_body["secret"]

        db.refresh(user)
        assert user.two_factor_secret == secret
        assert user.two_factor_enabled is False  # not yet confirmed

        # Confirm with a valid TOTP code.
        code = pyotp.TOTP(secret).now()
        confirm_res = client.post(
            "/api/v1/auth/2fa/confirm",
            json={"code": code},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert confirm_res.status_code == 200, confirm_res.text

        db.refresh(user)
        assert user.two_factor_enabled is True

        # Logging in now must return a challenge, not tokens.
        login_res = client.post("/api/v1/auth/login", json={"email": user.email, "password": password})
        assert login_res.status_code == 200, login_res.text
        login_body = login_res.json()
        assert login_body.get("two_factor_required") is True
        assert login_body["challenge_token"]
        assert "access_token" not in login_body

        # Completing the challenge with a fresh code issues real tokens.
        verify_res = client.post(
            "/api/v1/auth/2fa/verify-login",
            json={"challenge_token": login_body["challenge_token"], "code": pyotp.TOTP(secret).now()},
        )
        assert verify_res.status_code == 200, verify_res.text
        verify_body = verify_res.json()
        assert verify_body["access_token"]
        assert verify_body["refresh_token"]
    finally:
        db.close()


def test_confirm_two_factor_rejects_wrong_code():
    db = SessionLocal()
    try:
        user, password = _register_active_user(db)
        client = TestClient(app)
        access_token = _login(client, email=user.email, password=password)["access_token"]

        client.post("/api/v1/auth/2fa/setup", headers={"Authorization": f"Bearer {access_token}"})
        res = client.post(
            "/api/v1/auth/2fa/confirm",
            json={"code": "000000"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert res.status_code == 400

        db.refresh(user)
        assert user.two_factor_enabled is False
    finally:
        db.close()


def test_disable_two_factor_requires_correct_password():
    db = SessionLocal()
    try:
        user, password = _register_active_user(db)
        client = TestClient(app)
        access_token = _login(client, email=user.email, password=password)["access_token"]

        secret = client.post(
            "/api/v1/auth/2fa/setup", headers={"Authorization": f"Bearer {access_token}"},
        ).json()["secret"]
        client.post(
            "/api/v1/auth/2fa/confirm",
            json={"code": pyotp.TOTP(secret).now()},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        # Wrong password must not disable it.
        wrong_res = client.post(
            "/api/v1/auth/2fa/disable",
            json={"password": "NotTheRealPassword!"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert wrong_res.status_code == 401
        db.refresh(user)
        assert user.two_factor_enabled is True

        # Correct password disables it and clears the secret.
        ok_res = client.post(
            "/api/v1/auth/2fa/disable",
            json={"password": password},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        assert ok_res.status_code == 200, ok_res.text
        db.refresh(user)
        assert user.two_factor_enabled is False
        assert user.two_factor_secret is None

        # Login goes back to issuing tokens directly.
        body = _login(client, email=user.email, password=password)
        assert "access_token" in body and "two_factor_required" not in body
    finally:
        db.close()


def test_verify_login_rejects_invalid_challenge_token():
    client = TestClient(app)
    res = client.post(
        "/api/v1/auth/2fa/verify-login",
        json={"challenge_token": "not-a-real-token", "code": "123456"},
    )
    assert res.status_code == 401
