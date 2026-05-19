from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AccessLevel
from app.models.mixins import IdPkMixin

if TYPE_CHECKING:
    from app.models.plan import Plan
    from app.models.product import Product


class PlanProduct(Base, IdPkMixin):
    __tablename__ = "plan_products"
    __table_args__ = (UniqueConstraint("plan_id", "product_id", name="uq_plan_product_pair"),)

    plan_id: Mapped[int] = mapped_column(
        ForeignKey("plans.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    access_level: Mapped[AccessLevel] = mapped_column(
        Enum(AccessLevel, name="access_level", native_enum=True),
        nullable=False,
        default=AccessLevel.read,
        index=True,
    )

    plan: Mapped["Plan"] = relationship(back_populates="products")
    product: Mapped["Product"] = relationship(back_populates="plans")

    def __repr__(self) -> str:
        return (
            f"<PlanProduct id={self.id} plan_id={self.plan_id} product_id={self.product_id} "
            f"access_level={self.access_level.value}>"
        )

