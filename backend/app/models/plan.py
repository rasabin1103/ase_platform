from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import BillingCycle
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.plan_feature import PlanFeature
    from app.models.plan_product import PlanProduct
    from app.models.subscription import Subscription


class Plan(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "plans"

    code: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)

    billing_cycle: Mapped[BillingCycle] = mapped_column(
        Enum(BillingCycle, name="billing_cycle", native_enum=True),
        nullable=False,
        default=BillingCycle.monthly,
    )

    price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EUR")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0", index=True)
    is_recommended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    cta_label: Mapped[str | None] = mapped_column(String(200), nullable=True)

    subscriptions: Mapped[list["Subscription"]] = relationship(back_populates="plan")
    products: Mapped[list["PlanProduct"]] = relationship(
        back_populates="plan",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )
    features: Mapped[list["PlanFeature"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="PlanFeature.display_order",
    )

    def __repr__(self) -> str:
        return f"<Plan id={self.id} code={self.code!r} billing_cycle={self.billing_cycle.value} active={self.is_active}>"

