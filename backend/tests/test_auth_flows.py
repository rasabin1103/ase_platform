from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.main import app
from app.models.enums import UserStatus, UserTokenPurpose
from app.models.user import User
from app.models.user_verification_token import UserVerificationToken
from app.modules.auth.security import generate_raw_token, hash_action_token, hash_password, verify_password
from app.modules.auth.tokens_repository import UserTokensRepository


def test_register_creates_user_and_email_verification_token():
    db = SessionLocal()
    try:
        client = TestClient(app)
        email = f"reg_{secrets.token_hex(6)}@example.com"

        res = client.post(
            "/api/v1/auth/register",
            json={"email": email, "plain_password": "Password123!", "first_name": "New"},
        )
        assert res.status_code == 201, res.text
        body = res.json()
        assert body["email"] == email

        user = db.execute(select(User).where(User.email == email)).scalar_one()
        # Self-registration must never auto-verify — only an admin-created
        # account (UsersService.create_user) is allowed to skip this step.
        assert user.email_verified_at is None
        assert user.status == UserStatus.active

        token = db.execute(
            select(UserVerificationToken).where(
                UserVerificationToken.user_id == user.id,
                UserVerificationToken.purpose == UserTokenPurpose.email_verification,
            )
        ).scalar_one()
        assert token.used_at is None
        assert token.expires_at > datetime.now(timezone.utc)
    finally:
        db.close()


def test_login_wrong_password_returns_401():
    db = SessionLocal()
    try:
        email = f"login_{secrets.token_hex(6)}@example.com"
        user = User(email=email, password_hash=hash_password("Password123!"), status=UserStatus.active)
        db.add(user)
        db.commit()

        client = TestClient(app)
        res = client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPassword!"})
        assert res.status_code == 401
    finally:
        db.close()


def test_login_success_returns_token_pair():
    db = SessionLocal()
    try:
        email = f"login_{secrets.token_hex(6)}@example.com"
        user = User(email=email, password_hash=hash_password("Password123!"), status=UserStatus.active)
        db.add(user)
        db.commit()

        client = TestClient(app)
        res = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
        assert res.status_code == 200, res.text
        body = res.json()
        assert body["access_token"]
        assert body["refresh_token"]
    finally:
        db.close()


def test_email_verification_confirm_marks_user_verified():
    db = SessionLocal()
    try:
        email = f"verify_{secrets.token_hex(6)}@example.com"
        user = User(email=email, password_hash=hash_password("Password123!"), status=UserStatus.active)
        db.add(user)
        db.commit()
        db.refresh(user)

        raw_token = generate_raw_token()
        UserTokensRepository(db).create(
            user_id=user.id,
            purpose=UserTokenPurpose.email_verification,
            token_hash=hash_action_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.commit()

        client = TestClient(app)
        res = client.post("/api/v1/auth/email-verification/confirm", json={"token": raw_token})
        assert res.status_code == 200, res.text

        db.refresh(user)
        assert user.email_verified_at is not None

        # Re-using the same (now-consumed) token must fail.
        res2 = client.post("/api/v1/auth/email-verification/confirm", json={"token": raw_token})
        assert res2.status_code == 400
    finally:
        db.close()


def test_password_reset_request_is_silent_for_unknown_email():
    client = TestClient(app)
    res = client.post(
        "/api/v1/auth/password-reset/request",
        json={"email": f"nobody_{secrets.token_hex(6)}@example.com"},
    )
    # Always 200/ok — this endpoint must never leak whether an email exists.
    assert res.status_code == 200
    assert res.json() == {"ok": True}


def test_password_reset_confirm_changes_password():
    db = SessionLocal()
    try:
        email = f"reset_{secrets.token_hex(6)}@example.com"
        user = User(email=email, password_hash=hash_password("OldPassword123!"), status=UserStatus.active)
        db.add(user)
        db.commit()
        db.refresh(user)

        raw_token = generate_raw_token()
        UserTokensRepository(db).create(
            user_id=user.id,
            purpose=UserTokenPurpose.password_reset,
            token_hash=hash_action_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        )
        db.commit()

        client = TestClient(app)
        res = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={"token": raw_token, "new_password": "NewPassword456!"},
        )
        assert res.status_code == 200, res.text

        db.refresh(user)
        assert verify_password("NewPassword456!", user.password_hash)
        assert not verify_password("OldPassword123!", user.password_hash)

        # An expired/consumed token must be rejected on a second attempt.
        res2 = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={"token": raw_token, "new_password": "AnotherPassword789!"},
        )
        assert res2.status_code == 400
    finally:
        db.close()
