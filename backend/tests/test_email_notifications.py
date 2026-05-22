"""Resend/console email verification via notifications module."""

from __future__ import annotations

import uuid
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from tests.test_admin_users import _auth_header, _seed_super_admin

FIXED_EMAIL_TOKEN = "test-resend-email-token-fixed-value-32ch"


def test_resend_and_verify_email_console_provider():
    client = TestClient(app)
    db = SessionLocal()
    try:
        admin = _seed_super_admin(db, f"resend_{uuid.uuid4().hex}@example.com")
        admin.email_verified_at = None
        db.commit()
        headers = _auth_header(admin)

        with patch(
            "app.modules.notifications.service.generate_email_token",
            return_value=FIXED_EMAIL_TOKEN,
        ):
            resend = client.post("/api/v1/auth/email/resend-verification", headers=headers)
            assert resend.status_code == 200
            body = resend.json()
            assert body == {"message": "Verification email sent"}
            assert "dev_verify_url" not in body

            verify_post = client.post(
                "/api/v1/auth/email/verify",
                json={"token": FIXED_EMAIL_TOKEN},
            )
            assert verify_post.status_code == 200

        me = client.get("/api/v1/auth/me", headers=headers)
        assert me.json()["email_verified"] is True
        assert me.json()["email_verified_at"] is not None

        # Idempotent: second verify (e.g. React Strict Mode double submit) must not show false failure
        verify_again = client.post(
            "/api/v1/auth/email/verify",
            json={"token": FIXED_EMAIL_TOKEN},
        )
        assert verify_again.status_code == 200

        me2 = client.get("/api/v1/auth/me", headers=headers)
        assert me2.json()["email_verified"] is True
    finally:
        db.close()


def test_resend_requires_resend_api_key_when_provider_resend():
    client = TestClient(app)
    db = SessionLocal()
    try:
        admin = _seed_super_admin(db, f"resend2_{uuid.uuid4().hex}@example.com")
        headers = _auth_header(admin)

        with patch("app.modules.notifications.email_provider.settings") as mock_settings:
            mock_settings.EMAIL_PROVIDER = "resend"
            mock_settings.RESEND_API_KEY = ""
            mock_settings.EMAIL_FROM = "contact@arcesabinengineering.com"
            mock_settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES = 60
            mock_settings.FRONTEND_URL = "http://localhost:5173"

            resend = client.post("/api/v1/auth/email/resend-verification", headers=headers)
            assert resend.status_code == 502
            assert resend.json()["detail"] == "Could not send verification email"
    finally:
        db.close()
