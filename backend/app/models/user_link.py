from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class UserLink(Base, IdPkMixin, TimestampMixin):
    """One professional/portfolio link on a user's public profile
    (e.g. LinkedIn, GitHub, personal site) — a free-form label + URL pair,
    ordered by ``display_order``."""

    __tablename__ = "user_links"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    def __repr__(self) -> str:
        return f"<UserLink id={self.id} user_id={self.user_id} label={self.label!r}>"
