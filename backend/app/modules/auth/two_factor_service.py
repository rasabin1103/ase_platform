"""TOTP authenticator 2FA (Google Authenticator, Authy, 1Password, Bitwarden, etc.)."""

from __future__ import annotations

import logging
import re
import secrets
import string
from datetime import datetime, timezone

import pyotp
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limit import check_rate_limit, reset_rate_limit
from app.core.security import (
    create_2fa_pending_token,
    create_access_token,
    create_refresh_token,
    get_token_subject_uuid,
    verify_password,
)
from app.core.totp_crypto import load_totp_secret, store_totp_secret
from app.core.verification_crypto import hash_verification_secret
from app.models.user import User
from app.modules.auth.schemas import (
    LoginRequires2FA,
    TokenPair,
    TwoFactorConfirmResponse,
    TwoFactorDisableRequest,
    TwoFactorLoginConfirmRequest,
    TwoFactorRecoveryCodesResponse,
    TwoFactorSetupResponse,
    TwoFactorTotpCodeRequest,
)
from app.modules.auth.security_onboarding import sync_security_onboarding_completed_at
from app.modules.users.repository import UsersRepository

logger = logging.getLogger(__name__)

_RECOVERY_CODE_RE = re.compile(r"^ASE-[A-Z0-9]{4}-[A-Z0-9]{4}$")
_RECOVERY_ALPHABET = string.ascii_uppercase + string.digits


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _generate_recovery_code() -> str:
    g1 = "".join(secrets.choice(_RECOVERY_ALPHABET) for _ in range(4))
    g2 = "".join(secrets.choice(_RECOVERY_ALPHABET) for _ in range(4))
    return f"ASE-{g1}-{g2}"


def _build_recovery_storage(plain_codes: list[str]) -> dict:
    return {"version": 1, "hashes": [hash_verification_secret(c) for c in plain_codes]}


def _generate_recovery_codes_plain(count: int = 8) -> list[str]:
    return [_generate_recovery_code() for _ in range(count)]


class TwoFactorService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UsersRepository(db)

    def _totp(self, secret: str) -> pyotp.TOTP:
        return pyotp.TOTP(
            secret,
            digits=int(settings.TOTP_DIGITS),
            interval=int(settings.TOTP_INTERVAL_SECONDS),
        )

    def _normalize_code(self, code: str) -> str:
        return "".join(ch for ch in code.strip() if ch.isdigit())

    def _verify_totp(self, secret: str, code: str) -> bool:
        normalized = self._normalize_code(code)
        if len(normalized) != int(settings.TOTP_DIGITS):
            return False
        return bool(self._totp(secret).verify(normalized, valid_window=1))

    def _require_pending_secret(self, user: User) -> str:
        secret = load_totp_secret(user.two_factor_secret)
        if not secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid authentication code",
            )
        return secret

    def _require_enabled_secret(self, user: User) -> str:
        if not user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Two-factor authentication is not enabled",
            )
        return self._require_pending_secret(user)

    def _clear_two_factor(self, user: User) -> None:
        user.two_factor_enabled = False
        user.two_factor_secret = None
        user.two_factor_confirmed_at = None
        user.two_factor_recovery_codes = None

    def setup(self, user: User) -> TwoFactorSetupResponse:
        if user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Two-factor authentication is already enabled",
            )
        raw_secret = pyotp.random_base32()
        user.two_factor_secret = store_totp_secret(raw_secret)
        user.two_factor_confirmed_at = None
        user.two_factor_recovery_codes = None
        self.db.commit()
        self.db.refresh(user)

        totp = self._totp(raw_secret)
        otpauth_url = totp.provisioning_uri(name=user.email, issuer_name=settings.TOTP_ISSUER)
        logger.info(
            "2fa_setup_started user_id=%s two_factor_enabled=false secret_stored=true",
            user.id,
        )
        return TwoFactorSetupResponse(otpauth_url=otpauth_url, manual_key=raw_secret)

    def confirm(self, user: User, payload: TwoFactorTotpCodeRequest) -> TwoFactorConfirmResponse:
        check_rate_limit(f"2fa:confirm:{user.id}")
        secret = self._require_pending_secret(user)
        if not self._verify_totp(secret, payload.code):
            logger.info("2fa_confirm_failed user_id=%s reason=invalid_code", user.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid authentication code",
            )

        plain_codes = _generate_recovery_codes_plain()
        user.two_factor_enabled = True
        user.two_factor_confirmed_at = _now()
        user.two_factor_recovery_codes = _build_recovery_storage(plain_codes)
        self.db.commit()
        reset_rate_limit(f"2fa:confirm:{user.id}")
        logger.info(
            "2fa_confirm_success user_id=%s email_marked_verified=true recovery_codes_generated=true",
            user.id,
        )
        return TwoFactorConfirmResponse(recovery_codes=plain_codes)

    def disable(self, user: User, payload: TwoFactorDisableRequest) -> None:
        check_rate_limit(f"2fa:disable:{user.id}")
        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid password")
        if user.two_factor_enabled:
            secret = self._require_enabled_secret(user)
            if not self._verify_totp(secret, payload.code):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid authentication code",
                )
        self._clear_two_factor(user)
        sync_security_onboarding_completed_at(user)
        self.db.commit()
        reset_rate_limit(f"2fa:disable:{user.id}")
        logger.info("2fa_disabled user_id=%s", user.id)

    def regenerate_recovery_codes(
        self, user: User, payload: TwoFactorTotpCodeRequest
    ) -> TwoFactorRecoveryCodesResponse:
        check_rate_limit(f"2fa:recovery-regen:{user.id}")
        secret = self._require_enabled_secret(user)
        if not self._verify_totp(secret, payload.code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid authentication code",
            )
        plain_codes = _generate_recovery_codes_plain()
        user.two_factor_recovery_codes = _build_recovery_storage(plain_codes)
        self.db.commit()
        reset_rate_limit(f"2fa:recovery-regen:{user.id}")
        logger.info("2fa_recovery_codes_regenerated user_id=%s count=%s", user.id, len(plain_codes))
        return TwoFactorRecoveryCodesResponse(recovery_codes=plain_codes)

    def login_confirm(self, payload: TwoFactorLoginConfirmRequest) -> TokenPair:
        try:
            user_uuid = get_token_subject_uuid(
                payload.temporary_login_token, expected_type="2fa_pending"
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired login session",
            ) from None

        check_rate_limit(f"2fa:login:{user_uuid}")
        user = self.users.get_by_uuid(user_uuid)
        if user is None or not user.two_factor_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid authentication code",
            )

        secret = self._require_enabled_secret(user)
        if not self._verify_totp(secret, payload.code):
            logger.info("2fa_login_confirm_failed user_id=%s", user.id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid authentication code",
            )

        user.last_login_at = _now()
        self.db.commit()
        reset_rate_limit(f"2fa:login:{user_uuid}")
        logger.info("2fa_login_confirm_success user_id=%s", user.id)
        return TokenPair(
            access_token=create_access_token(user_uuid=user.uuid),
            refresh_token=create_refresh_token(user_uuid=user.uuid),
        )

    def create_login_challenge(self, user: User) -> LoginRequires2FA:
        return LoginRequires2FA(
            requires_2fa=True,
            temporary_login_token=create_2fa_pending_token(user_uuid=user.uuid),
        )

    @staticmethod
    def normalize_recovery_code(code: str) -> str | None:
        """Normalize user input for future recovery-login (not used in this phase)."""
        c = code.strip().upper().replace(" ", "")
        if _RECOVERY_CODE_RE.match(c):
            return c
        return None
