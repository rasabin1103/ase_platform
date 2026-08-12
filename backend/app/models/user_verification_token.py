from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import UserTokenPurpose
from app.models.mixins import IdPkMixin, TimestampMixin


class UserVerificationToken(Base, IdPkMixin, TimestampMixin):
    """One-time token backing both the "forgot password" and "verify email"
    flows. Only the SHA-256 hash of the token is stored — the raw token is
    only ever seen once, inside the emailed link, so a database leak alone
    can't be used to reset accounts or fake a verification."""

    __tablename__ = "user_verification_tokens"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    purpose: Mapped[UserTokenPurpose] = mapped_column(
        Enum(UserTokenPurpose, name="user_token_purpose", native_enum=True), nullable=False, index=True,
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
