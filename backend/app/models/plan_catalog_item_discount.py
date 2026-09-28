from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.catalog_item import CatalogItem
    from app.models.plan import Plan


class PlanCatalogItemDiscount(Base, IdPkMixin, TimestampMixin):
    """A discount a subscriber of `plan` gets on `catalog_item` when buying
    it separately — used only for items the plan does NOT already include
    (see PlanCatalogItem for the "included, free" side of things). Applied
    at checkout time in BillingService.checkout_catalog_item. Deleting the
    plan or the catalog item cleans up the row automatically (both FKs
    CASCADE), same pattern as PlanCatalogItem."""

    __tablename__ = "plan_catalog_item_discounts"
    __table_args__ = (UniqueConstraint("plan_id", "catalog_item_id", name="uq_plan_catalog_item_discount_pair"),)

    plan_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("plans.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    catalog_item_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("catalog_items.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    discount_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)

    plan: Mapped["Plan"] = relationship(back_populates="discounted_catalog_items")
    catalog_item: Mapped["CatalogItem"] = relationship()

    # Flat proxies onto the linked catalog item, same pattern as
    # PlanCatalogItem's own title/slug/type/short_description properties —
    # lets PlanCatalogItemDiscountRead (from_attributes=True) read them
    # directly off this row without a nested schema.
    @property
    def title(self) -> str:
        return self.catalog_item.title

    @property
    def slug(self) -> str:
        return self.catalog_item.slug

    @property
    def type(self):
        return self.catalog_item.type

    def __repr__(self) -> str:
        return (
            f"<PlanCatalogItemDiscount id={self.id} plan_id={self.plan_id} "
            f"catalog_item_id={self.catalog_item_id} discount_percent={self.discount_percent}>"
        )
