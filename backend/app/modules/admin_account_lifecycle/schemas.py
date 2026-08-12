from __future__ import annotations

from pydantic import BaseModel


class AccountLifecycleSummary(BaseModel):
    """Counts for the System status page — visibility into the automated
    2FA-grace / inactivity suspension / deletion policy (see
    app/core/account_lifecycle.py)."""

    enabled: bool
    two_factor_grace_days: int
    inactivity_suspend_days: int
    suspended_delete_days: int
    pending_two_factor_activation: int
    suspended_two_factor: int
    suspended_inactivity: int
    pending_deletion_soon: int


class AccountLifecycleSweepResult(BaseModel):
    suspended_two_factor: int
    suspended_inactivity: int
    deleted: int
