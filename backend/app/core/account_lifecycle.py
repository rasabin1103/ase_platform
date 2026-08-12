from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.config import settings
from app.core.email import send_email
from app.core.email_templates import (
    account_deleted_inactivity_email,
    account_suspended_inactivity_email,
    account_suspended_two_factor_email,
)
from app.core.user_anonymize import anonymize_user_pii
from app.models.enums import SuspensionReason, UserStatus
from app.models.member_role import MemberRole
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User

logger = logging.getLogger(__name__)


def _super_admin_user_ids(db: Session) -> set[int]:
    """super_admin accounts are always exempt from this policy — locking out
    (or worse, deleting) the only administrator via an unattended sweep is a
    far worse failure mode than leaving one admin account without 2FA."""
    stmt = (
        select(OrganizationMember.user_id)
        .join(MemberRole, MemberRole.organization_member_id == OrganizationMember.id)
        .join(Role, Role.id == MemberRole.role_id)
        .where(Role.code == "super_admin")
    )
    return {row[0] for row in db.execute(stmt).all()}


def run_two_factor_grace_sweep(db: Session) -> int:
    """Suspends any active account that never activated 2FA within
    settings.TWO_FACTOR_GRACE_DAYS of creation. Login still works enough to
    reach /auth/2fa/setup + /auth/2fa/confirm — confirming 2FA reactivates
    the account immediately (see AuthService.confirm_two_factor)."""
    exempt = _super_admin_user_ids(db)
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.TWO_FACTOR_GRACE_DAYS)
    stmt = select(User).where(
        User.status == UserStatus.active,
        User.two_factor_enabled.is_(False),
        User.created_at < cutoff,
    )
    users = [u for u in db.execute(stmt).scalars().all() if u.id not in exempt]

    login_url = f"{settings.FRONTEND_URL}/login"
    count = 0
    for user in users:
        try:
            user.status = UserStatus.suspended
            user.suspension_reason = SuspensionReason.two_factor_required.value
            user.suspended_at = datetime.now(timezone.utc)
            db.commit()
            html, text = account_suspended_two_factor_email(login_url, grace_days=settings.TWO_FACTOR_GRACE_DAYS)
            send_email(
                to_email=user.email,
                subject="Tu cuenta ha sido desactivada — Arce Sabin Engineering",
                html_body=html,
                text_body=text,
            )
            record_audit_log(
                db,
                actor_user_id=None,
                action="user.auto_suspended_two_factor",
                entity_type="user",
                entity_id=str(user.id),
                metadata={"grace_days": settings.TWO_FACTOR_GRACE_DAYS},
            )
            count += 1
        except Exception:
            db.rollback()
            logger.exception("Failed to suspend user %s for missing 2FA activation", user.id)
    return count


def run_inactivity_suspend_sweep(db: Session) -> int:
    """Suspends any active account with no login (or, for an account that
    never logged in, no activity since creation) for
    settings.INACTIVITY_SUSPEND_DAYS. A later successful login reactivates
    the account automatically."""
    exempt = _super_admin_user_ids(db)
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.INACTIVITY_SUSPEND_DAYS)
    stmt = select(User).where(User.status == UserStatus.active)
    users = [
        u
        for u in db.execute(stmt).scalars().all()
        if u.id not in exempt and (u.last_login_at or u.created_at) < cutoff
    ]

    login_url = f"{settings.FRONTEND_URL}/login"
    count = 0
    for user in users:
        try:
            user.status = UserStatus.suspended
            user.suspension_reason = SuspensionReason.inactivity.value
            user.suspended_at = datetime.now(timezone.utc)
            db.commit()
            html, text = account_suspended_inactivity_email(login_url, inactivity_days=settings.INACTIVITY_SUSPEND_DAYS)
            send_email(
                to_email=user.email,
                subject="Tu cuenta ha sido desactivada por inactividad — Arce Sabin Engineering",
                html_body=html,
                text_body=text,
            )
            record_audit_log(
                db,
                actor_user_id=None,
                action="user.auto_suspended_inactivity",
                entity_type="user",
                entity_id=str(user.id),
                metadata={"inactivity_days": settings.INACTIVITY_SUSPEND_DAYS},
            )
            count += 1
        except Exception:
            db.rollback()
            logger.exception("Failed to suspend user %s for inactivity", user.id)
    return count


def run_suspended_expiry_delete_sweep(db: Session) -> int:
    """Soft-deletes (anonymizes) any suspended account — regardless of why
    it was suspended — still not reactivated settings.SUSPENDED_DELETE_DAYS
    after the suspension. The notice email must be sent before anonymizing,
    since that scrubs the real email address."""
    exempt = _super_admin_user_ids(db)
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.SUSPENDED_DELETE_DAYS)
    stmt = select(User).where(User.status == UserStatus.suspended, User.suspended_at.is_not(None))
    users = [u for u in db.execute(stmt).scalars().all() if u.id not in exempt and u.suspended_at < cutoff]

    count = 0
    for user in users:
        try:
            html, text = account_deleted_inactivity_email(
                settings.SMTP_FROM_EMAIL, suspended_days=settings.SUSPENDED_DELETE_DAYS
            )
            send_email(
                to_email=user.email,
                subject="Tu cuenta ha sido eliminada — Arce Sabin Engineering",
                html_body=html,
                text_body=text,
            )
            previous_reason = user.suspension_reason
            anonymize_user_pii(db, user)
            user.status = UserStatus.deleted
            db.commit()
            record_audit_log(
                db,
                actor_user_id=None,
                action="user.auto_deleted_inactivity",
                entity_type="user",
                entity_id=str(user.id),
                metadata={"suspended_days": settings.SUSPENDED_DELETE_DAYS, "previous_reason": previous_reason},
            )
            count += 1
        except Exception:
            db.rollback()
            logger.exception("Failed to auto-delete long-suspended user %s", user.id)
    return count


def run_full_sweep(db: Session) -> dict[str, int]:
    """Runs all three passes in order — 2FA-grace first, then inactivity,
    then expired-suspension deletion — so a user who crosses both the 2FA
    and inactivity thresholds in the same run is only ever suspended once
    (the inactivity pass only looks at accounts still `active`). Called by
    the daily in-process scheduler and by the admin "run sweep now" action."""
    if not settings.ACCOUNT_LIFECYCLE_SWEEP_ENABLED:
        return {"suspended_two_factor": 0, "suspended_inactivity": 0, "deleted": 0}
    suspended_2fa = run_two_factor_grace_sweep(db)
    suspended_inactivity = run_inactivity_suspend_sweep(db)
    deleted = run_suspended_expiry_delete_sweep(db)
    return {
        "suspended_two_factor": suspended_2fa,
        "suspended_inactivity": suspended_inactivity,
        "deleted": deleted,
    }
