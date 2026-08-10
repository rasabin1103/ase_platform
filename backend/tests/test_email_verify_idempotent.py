"""Email verify token edge cases and safe logging."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.core.verification_crypto import generate_email_token, hash_verification_secret
from app.main import app
from app.models.email_verification_token import EmailVerificationToken
from app.core.security import hash_password
from app.models.enums import UserStatus
from app.models.user import User
from tests.test_admin_users import _seed_super_admin


def test_verify_rejects_unknown_token():
    client = TestClient(app)
    res = client.post("/api/v1/auth/email/verify", json={"token": "totally-unknown-token-value"})
    assert res.status_code == 400
    assert res.json()["detail"] == "Invalid or expired token"


def test_verify_rejects_expired_token():
    db = SessionLocal()
    try:
        admin = _seed_super_admin(db, f"exp_{uuid.uuid4().hex}@example.com")
        raw = generate_email_token()
        row = EmailVerificationToken(
            user_id=admin.id,
            token_hash=hash_verification_secret(raw),
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=5),
        )
        db.add(row)
        db.commit()

        client = TestClient(app)
        res = client.post("/api/v1/auth/email/verify", json={"token": raw})
        assert res.status_code == 400
        db.refresh(admin)
        assert admin.email_verified_at is None
    finally:
        db.close()


def test_verify_used_token_without_verified_user_returns_400():
    db = SessionLocal()
    try:
        user = User(
            email=f"used_{uuid.uuid4().hex}@example.com",
            password_hash=hash_password("Password123!"),
            status=UserStatus.active,
        )
        db.add(user)
        db.flush()
        raw = generate_email_token()
        now = datetime.now(timezone.utc)
        row = EmailVerificationToken(
            user_id=user.id,
            token_hash=hash_verification_secret(raw),
            expires_at=now + timedelta(hours=1),
            used_at=now,
        )
        db.add(row)
        db.commit()

        client = TestClient(app)
        res = client.post("/api/v1/auth/email/verify", json={"token": raw})
        assert res.status_code == 400
        assert res.json()["detail"] == "Verification link already used"
    finally:
        db.close()
