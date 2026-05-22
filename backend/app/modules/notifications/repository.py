from __future__ import annotations

from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.email_verification_token import EmailVerificationToken


class EmailVerificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def invalidate_pending_for_user(self, user_id: int, *, now: datetime) -> None:
        self.db.execute(
            update(EmailVerificationToken)
            .where(
                EmailVerificationToken.user_id == user_id,
                EmailVerificationToken.used_at.is_(None),
            )
            .values(used_at=now)
        )

    def create_token(
        self,
        *,
        user_id: int,
        token_hash: str,
        expires_at: datetime,
    ) -> EmailVerificationToken:
        row = EmailVerificationToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def get_by_hash(self, token_hash: str) -> EmailVerificationToken | None:
        return self.db.execute(
            select(EmailVerificationToken)
            .where(EmailVerificationToken.token_hash == token_hash)
            .order_by(EmailVerificationToken.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()

    def get_valid_by_hash(self, token_hash: str, *, now: datetime) -> EmailVerificationToken | None:
        return self.db.execute(
            select(EmailVerificationToken)
            .where(
                EmailVerificationToken.token_hash == token_hash,
                EmailVerificationToken.used_at.is_(None),
                EmailVerificationToken.expires_at > now,
            )
            .order_by(EmailVerificationToken.created_at.desc())
            .limit(1)
        ).scalar_one_or_none()
