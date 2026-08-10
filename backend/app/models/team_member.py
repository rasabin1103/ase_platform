from __future__ import annotations

from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class TeamMember(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """Real people behind ASE, shown on the public 'Sobre ASE' page.

    ``is_active`` defaults to False on purpose: a row must be reviewed and
    confirmed with real data (name, role, bio) before it can appear publicly.
    """

    __tablename__ = "team_members"

    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role_title: Mapped[str] = mapped_column(String(200), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false", index=True)

    def __repr__(self) -> str:
        return f"<TeamMember id={self.id} full_name={self.full_name!r} is_active={self.is_active}>"
