"""Security onboarding: email verification + TOTP MFA before sensitive actions."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from fastapi import Depends, HTTPException, status

from app.models.user import User
from app.modules.auth.dependencies import get_current_user

SecurityOnboardingStatus = Literal[
    "completed",
    "pending_email_verification",
    "pending_mfa_setup",
    "pending_both",
]

SECURITY_ONBOARDING_REQUIRED_CODE = "SECURITY_ONBOARDING_REQUIRED"
SECURITY_ONBOARDING_REQUIRED_MESSAGE = (
    "You must verify your email and enable two-factor authentication before performing this action."
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def mfa_enabled(user: User) -> bool:
    """MFA is active only after TOTP confirm (``two_factor_enabled``), not during QR setup."""
    return bool(user.two_factor_enabled)


def compute_security_onboarding_status(user: User) -> SecurityOnboardingStatus:
    email_ok = user.email_verified_at is not None
    mfa_ok = mfa_enabled(user)
    if email_ok and mfa_ok:
        return "completed"
    if not email_ok and not mfa_ok:
        return "pending_both"
    if not email_ok:
        return "pending_email_verification"
    return "pending_mfa_setup"


def is_security_onboarding_complete(user: User) -> bool:
    return compute_security_onboarding_status(user) == "completed"


def requires_security_onboarding(user: User) -> bool:
    return not is_security_onboarding_complete(user)


def can_dismiss_security_warning(user: User) -> bool:
    return requires_security_onboarding(user)


def sync_security_onboarding_completed_at(user: User) -> None:
    """Set completion timestamp when both email and MFA are satisfied."""
    if is_security_onboarding_complete(user):
        if user.security_onboarding_completed_at is None:
            user.security_onboarding_completed_at = _now()
    else:
        user.security_onboarding_completed_at = None


def security_onboarding_fields(user: User) -> dict:
    status = compute_security_onboarding_status(user)
    return {
        "mfa_enabled": mfa_enabled(user),
        "mfa_verified_at": user.two_factor_confirmed_at,
        "security_onboarding_completed_at": user.security_onboarding_completed_at,
        "security_warning_dismissed_at": user.security_warning_dismissed_at,
        "security_warning_count": int(user.security_warning_count or 0),
        "security_onboarding_status": status,
        "requires_security_onboarding": status != "completed",
        "can_dismiss_security_warning": status != "completed",
    }


def security_onboarding_error_detail(user: User) -> dict:
    status = compute_security_onboarding_status(user)
    return {
        "code": SECURITY_ONBOARDING_REQUIRED_CODE,
        "message": SECURITY_ONBOARDING_REQUIRED_MESSAGE,
        "security_onboarding_status": status,
    }


def ensure_security_onboarding_complete(user: User) -> None:
    if is_security_onboarding_complete(user):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=security_onboarding_error_detail(user),
    )


def require_security_onboarding(user: User = Depends(get_current_user)) -> None:
    """FastAPI dependency for sensitive mutations."""
    ensure_security_onboarding_complete(user)


def dismiss_security_warning(user: User) -> None:
    user.security_warning_dismissed_at = _now()
    user.security_warning_count = int(user.security_warning_count or 0) + 1
