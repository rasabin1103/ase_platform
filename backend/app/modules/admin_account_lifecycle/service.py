from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.account_lifecycle import run_full_sweep
from app.core.config import settings
from app.models.enums import SuspensionReason, UserStatus
from app.models.user import User
from app.modules.admin_account_lifecycle.schemas import AccountLifecycleSummary, AccountLifecycleSweepResult

# How soon a suspended account's auto-delete deadline must be to count as
# "pending deletion soon" on the summary card — a fixed lookahead window,
# independent of settings.SUSPENDED_DELETE_DAYS itself.
_DELETION_LOOKAHEAD_DAYS = 14


class AccountLifecycleAdminService:
    def __init__(self, db: Session):
        self.db = db

    def _count(self, *conditions) -> int:
        stmt = select(func.count()).select_from(User).where(*conditions)
        return int(self.db.execute(stmt).scalar_one())

    def summary(self) -> AccountLifecycleSummary:
        now = datetime.now(timezone.utc)
        deletion_lookahead_cutoff = now - timedelta(days=settings.SUSPENDED_DELETE_DAYS - _DELETION_LOOKAHEAD_DAYS)

        return AccountLifecycleSummary(
            enabled=settings.ACCOUNT_LIFECYCLE_SWEEP_ENABLED,
            two_factor_grace_days=settings.TWO_FACTOR_GRACE_DAYS,
            inactivity_suspend_days=settings.INACTIVITY_SUSPEND_DAYS,
            suspended_delete_days=settings.SUSPENDED_DELETE_DAYS,
            pending_two_factor_activation=self._count(
                User.status == UserStatus.active, User.two_factor_enabled.is_(False)
            ),
            suspended_two_factor=self._count(
                User.status == UserStatus.suspended,
                User.suspension_reason == SuspensionReason.two_factor_required.value,
            ),
            suspended_inactivity=self._count(
                User.status == UserStatus.suspended,
                User.suspension_reason == SuspensionReason.inactivity.value,
            ),
            pending_deletion_soon=self._count(
                User.status == UserStatus.suspended,
                User.suspended_at.is_not(None),
                User.suspended_at <= deletion_lookahead_cutoff,
            ),
        )

    def run_sweep_now(self) -> AccountLifecycleSweepResult:
        result = run_full_sweep(self.db)
        return AccountLifecycleSweepResult(**result)
