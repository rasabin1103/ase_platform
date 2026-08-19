from __future__ import annotations

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin


class CatalogItemDimensionSelection(Base, IdPkMixin):
    """Join row: which level a catalog item picked for one dimension type
    (e.g. this course picked "Avanzada" for Duración and "Certificación
    oficial" for Especialización). One row per (catalog_item, dimension
    type) — a pillar with several dimension types gets several rows per
    item. CASCADE on every FK: deleting the item, the dimension type, or
    the specific level all just remove the selection, never block it."""

    __tablename__ = "catalog_item_dimension_selections"
    __table_args__ = (
        UniqueConstraint("catalog_item_id", "dimension_type_id", name="uq_catalog_item_dimension_type"),
    )

    catalog_item_id: Mapped[int] = mapped_column(
        ForeignKey("catalog_items.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    dimension_type_id: Mapped[int] = mapped_column(
        ForeignKey("pricing_dimension_types.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    dimension_level_id: Mapped[int] = mapped_column(
        ForeignKey("pricing_dimension_levels.id", ondelete="CASCADE"), nullable=False, index=True,
    )

    def __repr__(self) -> str:
        return (
            f"<CatalogItemDimensionSelection catalog_item_id={self.catalog_item_id} "
            f"dimension_type_id={self.dimension_type_id} dimension_level_id={self.dimension_level_id}>"
        )
