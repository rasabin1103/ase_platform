from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import VerificationChannel
from app.models.mixins import IdPkMixin

if TYPE_CHECKING:
    from app.models.user import User


class UserVerificationChallenge(Base, IdPkMixin):
    __tablename__ = "user_verification_challenges"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    channel: Mapped[VerificationChannel] = mapped_column(
        Enum(VerificationChannel, name="verification_channel", native_enum=True),
        nullable=False,
        index=True,
    )
    destination: Mapped[str] = mapped_column(String(320), nullable=False)
    secret_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped["User"] = relationship("User")
