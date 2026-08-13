"""Tests the automated account-lifecycle policy (app/core/account_lifecycle.py)
directly against the sweep functions — this is the platform's most complex
piece of business logic from this engagement, so it gets dedicated coverage
beyond a simple HTTP smoke test: the three-tier suspend/reactivate/delete
state machine, and the super_admin exemption."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.orm import Session

from app.core.account_lifecycle import (
    run_inactivity_suspend_sweep,
    run_suspended_expiry_delete_sweep,
    run_two_factor_grace_sweep,
)
from app.core.config import settings
from app.models.enums import SuspensionReason, UserStatus
from tests.conftest import make_user_with_role

from app.models.enums import OrganizationType, RoleScope


@pytest.fixture(autouse=True)
def _no_real_email(monkeypatch: pytest.MonkeyPatch):
    """The sweeps send a notification email on every transition — force
    SMTP_HOST off so a locally/CI-configured .env can never cause a test run
    to attempt a real send to a fake @example.test address."""
    monkeypatch.setattr(settings, "SMTP_HOST", "")


def _make_independent_user(db: Session, email: str):
    return make_user_with_role(
        db,
        email=email,
        role_code="independent_user",
        org_type=OrganizationType.individual,
        role_scope=RoleScope.personal_workspace,
    )


def test_two_factor_grace_sweep_suspends_accounts_past_the_grace_period(db: Session):
    user = _make_independent_user(db, "no-2fa@example.test")
    user.created_at = datetime.now(timezone.utc) - timedelta(days=settings.TWO_FACTOR_GRACE_DAYS + 1)
    db.commit()

    count = run_two_factor_grace_sweep(db)

    db.refresh(user)
    assert count == 1
    assert user.status == UserStatus.suspended
    assert user.suspension_reason == SuspensionReason.two_factor_required.value
    assert user.suspended_at is not None


def test_two_factor_grace_sweep_leaves_recent_accounts_alone(db: Session):
    user = _make_independent_user(db, "fresh@example.test")
    # created "now" (fixture default) — well within the grace period.

    count = run_two_factor_grace_sweep(db)

    db.refresh(user)
    assert count == 0
    assert user.status == UserStatus.active


def test_two_factor_grace_sweep_exempts_super_admin(db: Session):
    admin = make_user_with_role(
        db,
        email="admin@example.test",
        role_code="super_admin",
        org_type=OrganizationType.enterprise,
        role_scope=RoleScope.platform,
    )
    admin.created_at = datetime.now(timezone.utc) - timedelta(days=settings.TWO_FACTOR_GRACE_DAYS + 30)
    db.commit()

    count = run_two_factor_grace_sweep(db)

    db.refresh(admin)
    assert count == 0
    assert admin.status == UserStatus.active


def test_inactivity_sweep_suspends_accounts_past_the_threshold(db: Session):
    user = _make_independent_user(db, "inactive@example.test")
    user.two_factor_enabled = True  # isolate from the 2FA-grace sweep
    user.created_at = datetime.now(timezone.utc) - timedelta(days=settings.INACTIVITY_SUSPEND_DAYS + 1)
    db.commit()

    count = run_inactivity_suspend_sweep(db)

    db.refresh(user)
    assert count == 1
    assert user.status == UserStatus.suspended
    assert user.suspension_reason == SuspensionReason.inactivity.value


def test_suspended_expiry_delete_sweep_anonymizes_long_suspended_accounts(db: Session):
    user = _make_independent_user(db, "long-suspended@example.test")
    original_email = user.email
    user.status = UserStatus.suspended
    user.suspension_reason = SuspensionReason.inactivity.value
    user.suspended_at = datetime.now(timezone.utc) - timedelta(days=settings.SUSPENDED_DELETE_DAYS + 1)
    db.commit()

    count = run_suspended_expiry_delete_sweep(db)

    db.refresh(user)
    assert count == 1
    assert user.status == UserStatus.deleted
    assert user.email != original_email  # anonymize_user_pii scrubs the real address


def test_suspended_expiry_delete_sweep_leaves_recently_suspended_accounts(db: Session):
    user = _make_independent_user(db, "just-suspended@example.test")
    user.status = UserStatus.suspended
    user.suspension_reason = SuspensionReason.inactivity.value
    user.suspended_at = datetime.now(timezone.utc) - timedelta(days=1)
    db.commit()

    count = run_suspended_expiry_delete_sweep(db)

    db.refresh(user)
    assert count == 0
    assert user.status == UserStatus.suspended
