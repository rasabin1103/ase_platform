from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.notifications.sms_sender import send_verification_sms
from app.core.verification_crypto import generate_sms_code, hash_verification_secret
from app.models.enums import VerificationChannel
from app.models.user import User
from app.models.user_verification_challenge import UserVerificationChallenge
from sqlalchemy import select


def _now() -> datetime:
    return datetime.now(timezone.utc)


class VerificationService:
    """Phone/SMS verification (email uses app.modules.notifications)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def _invalidate_channel(self, user_id: int, channel: VerificationChannel) -> None:
        self.db.execute(
            delete(UserVerificationChallenge).where(
                UserVerificationChallenge.user_id == user_id,
                UserVerificationChallenge.channel == channel,
                UserVerificationChallenge.consumed_at.is_(None),
            )
        )

    def send_phone_verification(self, user: User) -> dict[str, str | None]:
        if not user.phone_e164:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Add a phone number before verifying",
            )

        code = generate_sms_code()
        expires = _now() + timedelta(minutes=settings.VERIFICATION_SMS_EXPIRE_MINUTES)
        self._invalidate_channel(user.id, VerificationChannel.sms)
        self.db.add(
            UserVerificationChallenge(
                user_id=user.id,
                channel=VerificationChannel.sms,
                destination=user.phone_e164,
                secret_hash=hash_verification_secret(code),
                expires_at=expires,
            )
        )
        self.db.flush()

        send_verification_sms(to_e164=user.phone_e164, code=code)

        dev_hint: str | None = None
        if settings.VERIFICATION_DEV_EXPOSE and (settings.SMS_DEV_LOG_ONLY or not settings.TWILIO_ACCOUNT_SID):
            dev_hint = code
        return {"message": "verification_sms_sent", "dev_code": dev_hint}

    def confirm_phone_code(self, user: User, code: str) -> User:
        code = code.strip()
        if not code or len(code) != 6 or not code.isdigit():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

        if not user.phone_e164:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No phone on account")

        secret_hash = hash_verification_secret(code)
        challenge = self.db.execute(
            select(UserVerificationChallenge)
            .where(
                UserVerificationChallenge.user_id == user.id,
                UserVerificationChallenge.channel == VerificationChannel.sms,
                UserVerificationChallenge.destination == user.phone_e164,
                UserVerificationChallenge.secret_hash == secret_hash,
                UserVerificationChallenge.consumed_at.is_(None),
            )
            .order_by(UserVerificationChallenge.id.desc())
            .limit(1)
        ).scalar_one_or_none()

        if challenge is None or challenge.expires_at < _now():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code")

        challenge.consumed_at = _now()
        user.phone_verified_at = _now()
        self.db.flush()
        return user
