from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdPkMixin

if TYPE_CHECKING:
    from app.models.catalog_item import CatalogItem
    from app.models.plan import Plan


class PlanCatalogItem(Base, IdPkMixin):
    """What a plan includes, expressed as a link to a real catalog item —
    replaces the old free-text plan_features bullets. Deleting the plan or
    the catalog item cleans up the link automatically (both FKs CASCADE)."""

    __tablename__ = "plan_catalog_items"
    __table_args__ = (UniqueConstraint("plan_id", "catalog_item_id", name="uq_plan_catalog_item_pair"),)

    plan_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    catalog_item_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("catalog_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    plan: Mapped["Plan"] = relationship(back_populates="included_catalog_items")
    catalog_item: Mapped["CatalogItem"] = relationship()

    # Flat proxies onto the linked catalog item — let PlanCatalogItemRead
    # (Pydantic, from_attributes=True) read title/slug/type/short_description
    # directly off this row without a nested schema, same pattern as
    # AuditLog.actor_email/actor_display_name.
    @property
    def title(self) -> str:
        return self.catalog_item.title

    @property
    def slug(self) -> str:
        return self.catalog_item.slug

    @property
    def type(self):
        return self.catalog_item.type

    @property
    def short_description(self) -> str:
        return self.catalog_item.short_description

    def __repr__(self) -> str:
        return f"<PlanCatalogItem id={self.id} plan_id={self.plan_id} catalog_item_id={self.catalog_item_id}>"
