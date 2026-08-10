from __future__ import annotations

from sqlalchemy import Boolean, Integer, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class Testimonial(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """Client/student quotes shown as social proof on public pages.

    ``is_active`` defaults to False: only real, attributable testimonials
    should ever be flipped to True. Do not publish fabricated quotes —
    that is a straightforward path to deceptive marketing claims.
    """

    __tablename__ = "testimonials"

    author_name: Mapped[str] = mapped_column(String(200), nullable=False)
    author_role: Mapped[str | None] = mapped_column(String(200), nullable=True)
    author_company: Mapped[str | None] = mapped_column(String(200), nullable=True)
    quote: Mapped[str] = mapped_column(Text, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    rating: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)  # 1-5, optional

    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false", index=True)

    def __repr__(self) -> str:
        return f"<Testimonial id={self.id} author_name={self.author_name!r} is_active={self.is_active}>"
