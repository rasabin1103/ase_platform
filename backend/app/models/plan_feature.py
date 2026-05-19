from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.plan import Plan


class PlanFeature(Base, IdPkMixin, TimestampMixin):
    """A single bullet/feature line for a plan (pricing / marketing)."""

    __tablename__ = "plan_features"

    plan_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Column name in DB is ``text`` (quoted in migration); Python attribute avoids ``text`` helper name clash.
    blurb: Mapped[str] = mapped_column("text", Text(), nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    plan: Mapped["Plan"] = relationship(back_populates="features")

    def __repr__(self) -> str:
        return f"<PlanFeature id={self.id} plan_id={self.plan_id} order={self.display_order}>"
