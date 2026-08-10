"""Security onboarding status, dismiss, and sensitive-action guard."""

from __future__ import annotations

import uuid

import pyotp
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from tests.test_admin_users import _auth_header, _seed_super_admin

client = TestClient(app)


def test_me_pending_email_verification():
    db = SessionLocal()
    try:
        email = f"so_{uuid.uuid4().hex}@example.com"
        user = _seed_super_admin(db, email)
        user.email_verified_at = None
        user.two_factor_enabled = False
        db.commit()
        db.refresh(user)

        me = client.get("/api/v1/auth/me", headers=_auth_header(user))
        assert me.status_code == 200
        body = me.json()
        assert body["security_onboarding_status"] == "pending_email_verification"
        assert body["requires_security_onboarding"] is True
        assert body["mfa_enabled"] is False
        assert "two_factor_secret" not in body
    finally:
        db.close()


def test_me_pending_mfa_setup():
    db = SessionLocal()
    try:
        from datetime import datetime, timezone

        email = f"so2_{uuid.uuid4().hex}@example.com"
        user = _seed_super_admin(db, email)
        user.email_verified_at = datetime.now(timezone.utc)
        user.two_factor_enabled = False
        db.commit()
        db.refresh(user)

        me = client.get("/api/v1/auth/me", headers=_auth_header(user))
        assert me.json()["security_onboarding_status"] == "pending_mfa_setup"
        assert me.json()["requires_security_onboarding"] is True
    finally:
        db.close()


def test_me_completed_with_mfa():
    db = SessionLocal()
    try:
        from datetime import datetime, timezone

        email = f"so3_{uuid.uuid4().hex}@example.com"
        user = _seed_super_admin(db, email)
        user.email_verified_at = datetime.now(timezone.utc)
        user.two_factor_enabled = True
        user.two_factor_confirmed_at = datetime.now(timezone.utc)
        user.security_onboarding_completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)

        me = client.get("/api/v1/auth/me", headers=_auth_header(user))
        body = me.json()
        assert body["security_onboarding_status"] == "completed"
        assert body["requires_security_onboarding"] is False
        assert body["mfa_enabled"] is True
    finally:
        db.close()


def test_sensitive_action_blocked_without_onboarding():
    db = SessionLocal()
    try:
        email = f"so4_{uuid.uuid4().hex}@example.com"
        user = _seed_super_admin(db, email)
        user.email_verified_at = None
        user.two_factor_enabled = False
        db.commit()

        res = client.post(
            "/api/v1/onboarding/create-organization",
            headers=_auth_header(user),
            json={
                "organization_name": "Test Org",
                "organization_slug": f"org-{uuid.uuid4().hex[:8]}",
            },
        )
        assert res.status_code == 403
        detail = res.json()["detail"]
        assert detail["code"] == "SECURITY_ONBOARDING_REQUIRED"
        assert detail["security_onboarding_status"] in (
            "pending_email_verification",
            "pending_both",
        )
    finally:
        db.close()


def test_dismiss_increments_warning_count():
    db = SessionLocal()
    try:
        email = f"so5_{uuid.uuid4().hex}@example.com"
        user = _seed_super_admin(db, email)
        user.email_verified_at = None
        db.commit()
        db.refresh(user)

        res = client.post("/api/v1/auth/security-warning/dismiss", headers=_auth_header(user))
        assert res.status_code == 200
        body = res.json()
        assert body["security_warning_count"] >= 1
        assert body["security_warning_dismissed_at"] is not None

        db.refresh(user)
        assert user.security_warning_count >= 1
    finally:
        db.close()
