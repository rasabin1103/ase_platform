from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdPkMixin

if TYPE_CHECKING:
    from app.models.user import User


class ErrorLog(Base, IdPkMixin):
    """Unhandled-exception trail, captured by the global exception handler
    in app/main.py. This is a lightweight, self-hosted substitute for a
    third-party error monitor (Sentry) — good enough to spot and triage
    5xx bugs from the admin panel without requiring any external account.
    Writing a row must never itself raise (see app/core/error_logging.py);
    a broken logging path can never be allowed to break the response it's
    describing."""

    __tablename__ = "error_logs"

    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    method: Mapped[str] = mapped_column(String(10), nullable=False)
    path: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    status_code: Mapped[int] = mapped_column(Integer, nullable=False, default=500)

    error_type: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    traceback: Mapped[str] = mapped_column(Text, nullable=False)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )
    ip_address: Mapped[str | None] = mapped_column(String(64))

    user: Mapped["User | None"] = relationship()

    @property
    def user_email(self) -> str | None:
        return self.user.email if self.user else None

    def __repr__(self) -> str:
        return f"<ErrorLog id={self.id} error_type={self.error_type!r} path={self.path!r}>"
