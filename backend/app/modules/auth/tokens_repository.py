from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.enums import UserTokenPurpose
from app.models.user_verification_token import UserVerificationToken


class UserTokensRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, *, user_id: int, purpose: UserTokenPurpose, token_hash: str, expires_at: datetime) -> UserVerificationToken:
        row = UserVerificationToken(user_id=user_id, purpose=purpose, token_hash=token_hash, expires_at=expires_at)
        self.db.add(row)
        self.db.flush()
        return row

    def find_valid(self, *, token_hash: str, purpose: UserTokenPurpose) -> UserVerificationToken | None:
        now = datetime.now(timezone.utc)
        return self.db.execute(
            select(UserVerificationToken).where(
                UserVerificationToken.token_hash == token_hash,
                UserVerificationToken.purpose == purpose,
                UserVerificationToken.used_at.is_(None),
                UserVerificationToken.expires_at > now,
            )
        ).scalar_one_or_none()

    def mark_used(self, token: UserVerificationToken) -> None:
        token.used_at = datetime.now(timezone.utc)
        self.db.add(token)

    def invalidate_outstanding(self, *, user_id: int, purpose: UserTokenPurpose) -> None:
        """Mark every other still-usable token of this purpose for the user
        as used, so an old emailed link can't be replayed after a newer one
        was issued (or after the flow it protects already completed)."""
        now = datetime.now(timezone.utc)
        self.db.execute(
            update(UserVerificationToken)
            .where(
                UserVerificationToken.user_id == user_id,
                UserVerificationToken.purpose == purpose,
                UserVerificationToken.used_at.is_(None),
            )
            .values(used_at=now)
        )
