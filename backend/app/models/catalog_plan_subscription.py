from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.catalog_pricing_plan import CatalogPricingPlan
    from app.models.user import User


class CatalogPlanSubscription(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "catalog_plan_subscriptions"
    __table_args__ = (
        UniqueConstraint("user_id", "catalog_pricing_plan_id", name="uq_catalog_plan_subscriptions_user_plan"),
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    catalog_pricing_plan_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_pricing_plans.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    user: Mapped["User"] = relationship("User")
    pricing_plan: Mapped["CatalogPricingPlan"] = relationship(
        "CatalogPricingPlan",
        back_populates="subscriptions",
    )
