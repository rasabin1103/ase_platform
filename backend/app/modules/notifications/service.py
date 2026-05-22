from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.verification_crypto import generate_email_token, hash_verification_secret
from app.models.user import User
from app.modules.notifications.email_provider import get_email_provider
from app.modules.notifications.exceptions import EmailDeliveryError
from app.modules.notifications.repository import EmailVerificationRepository
from app.modules.notifications.templates import verification_email_html, verification_email_subject

logger = logging.getLogger(__name__)

VERIFICATION_EMAIL_SENT_MESSAGE = "Verification email sent"


def _now() -> datetime:
    return datetime.now(timezone.utc)


class NotificationService:
    """Transactional email (verification, future password reset / alerts)."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = EmailVerificationRepository(db)
        self._email = get_email_provider()

    def build_verification_url(self, token: str) -> str:
        return f"{settings.FRONTEND_URL.rstrip('/')}/verify-email?token={token}"

    def send_email_verification(self, user: User) -> None:
        if not user.email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No email on account")

        provider = (settings.EMAIL_PROVIDER or "console").strip().lower()
        token = generate_email_token()
        token_hash = hash_verification_secret(token)
        expires = _now() + timedelta(minutes=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES)

        self.repo.invalidate_pending_for_user(user.id, now=_now())
        self.repo.create_token(user_id=user.id, token_hash=token_hash, expires_at=expires)

        verify_url = self.build_verification_url(token)
        subject = verification_email_subject()
        html = verification_email_html(
            verify_url=verify_url,
            expire_minutes=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES,
        )

        logger.info(
            "verification_email_dispatch provider=%s to=%s from=%s frontend_base=%s",
            provider,
            user.email,
            settings.EMAIL_FROM,
            settings.FRONTEND_URL.rstrip("/"),
        )

        try:
            self._email.send_email(to=user.email, subject=subject, html=html)
        except EmailDeliveryError as exc:
            logger.error(
                "verification_email_send_failed provider=%s user_id=%s reason=%s",
                provider,
                user.id,
                exc,
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not send verification email",
            ) from exc

    def verify_email_token(self, raw_token: str) -> User:
        token = raw_token.strip()
        if not token:
            logger.info(
                "email_verify token_found=false token_expired=false token_used=false "
                "email_marked_verified=false reason=empty_token"
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

        token_hash = hash_verification_secret(token)
        now = _now()
        row = self.repo.get_by_hash(token_hash)

        token_found = row is not None
        token_used = bool(row and row.used_at is not None)
        token_expired = bool(row and row.used_at is None and row.expires_at <= now)

        if not token_found:
            logger.info(
                "email_verify token_found=false token_expired=false token_used=false "
                "email_marked_verified=false"
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

        user = self.db.get(User, row.user_id)
        if user is None:
            logger.info(
                "email_verify token_found=true token_expired=%s token_used=%s "
                "email_marked_verified=false reason=user_missing",
                token_expired,
                token_used,
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

        if token_used:
            if user.email_verified_at is not None:
                logger.info(
                    "email_verify token_found=true token_expired=false token_used=true "
                    "email_marked_verified=false reason=already_verified_idempotent"
                )
                return user
            logger.info(
                "email_verify token_found=true token_expired=false token_used=true "
                "email_marked_verified=false reason=link_already_used"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification link already used",
            )

        if token_expired:
            logger.info(
                "email_verify token_found=true token_expired=true token_used=false "
                "email_marked_verified=false"
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")

        row.used_at = now
        user.email_verified_at = now
        from app.modules.auth.security_onboarding import sync_security_onboarding_completed_at

        sync_security_onboarding_completed_at(user)
        self.db.flush()
        logger.info(
            "email_verify token_found=true token_expired=false token_used=false "
            "email_marked_verified=true user_id=%s",
            user.id,
        )
        return user
