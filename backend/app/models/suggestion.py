from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User

SUGGESTION_STATUSES = ("pending", "reviewed", "resolved")
SUGGESTION_TARGETS = ("platform", "organization")


class Suggestion(Base, IdPkMixin, TimestampMixin):
    """A free-text request or recommendation submitted by a user — the
    "buzón de sugerencias". ``status`` is a plain string (see
    ``SUGGESTION_STATUSES``) rather than a native Postgres enum, so new
    statuses never require a migration."""

    __tablename__ = "suggestions"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    organization_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("organizations.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    message: Mapped[str] = mapped_column(Text, nullable=False)
    target: Mapped[str] = mapped_column(String(16), nullable=False, default="platform", index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending", index=True)
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_user_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    organization: Mapped["Organization | None"] = relationship(foreign_keys=[organization_id])

    def __repr__(self) -> str:
        return f"<Suggestion id={self.id} user_id={self.user_id} status={self.status!r}>"
