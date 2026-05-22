"""Profile email/SMS verification flows."""

from __future__ import annotations

import uuid
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from tests.test_admin_users import _auth_header, _seed_super_admin

FIXED_EMAIL_TOKEN = "test-email-verify-token-fixed-value-32chars"


def test_email_and_phone_verification_dev_mode():
    client = TestClient(app)
    db = SessionLocal()
    try:
        suffix = uuid.uuid4().int % 1_000_000_000
        admin = _seed_super_admin(db, f"verify_{uuid.uuid4().hex}@example.com")
        admin.phone_e164 = f"+346{suffix:09d}"[:16]
        admin.phone_verified_at = None
        admin.email_verified_at = None
        db.commit()
        headers = _auth_header(admin)

        with patch(
            "app.modules.notifications.service.generate_email_token",
            return_value=FIXED_EMAIL_TOKEN,
        ):
            email_send = client.post("/api/v1/auth/me/verify/email/send", headers=headers)
            assert email_send.status_code == 200
            body = email_send.json()
            assert body["message"] == "Verification email sent"
            assert "dev_verify_url" not in body
            assert "token" not in body

            confirm = client.get(
                f"/api/v1/auth/verify/email?token={FIXED_EMAIL_TOKEN}",
            )
            assert confirm.status_code == 200

        me = client.get("/api/v1/auth/me", headers=headers)
        assert me.json()["email_verified"] is True

        sms_send = client.post("/api/v1/auth/me/verify/phone/send", headers=headers)
        assert sms_send.status_code == 200
        dev_code = sms_send.json().get("dev_code")
        if dev_code:
            phone_confirm = client.post(
                "/api/v1/auth/me/verify/phone/confirm",
                headers=headers,
                json={"code": dev_code},
            )
            assert phone_confirm.status_code == 200
    finally:
        db.close()
