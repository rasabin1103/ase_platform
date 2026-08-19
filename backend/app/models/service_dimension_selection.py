from __future__ import annotations

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin


class ServiceDimensionSelection(Base, IdPkMixin):
    """Join row: which level a service picked for one dimension type. Mirror
    of CatalogItemDimensionSelection for the service pillar — see that
    model's docstring."""

    __tablename__ = "service_dimension_selections"
    __table_args__ = (
        UniqueConstraint("service_id", "dimension_type_id", name="uq_service_dimension_type"),
    )

    service_id: Mapped[int] = mapped_column(
        ForeignKey("services.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    dimension_type_id: Mapped[int] = mapped_column(
        ForeignKey("pricing_dimension_types.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    dimension_level_id: Mapped[int] = mapped_column(
        ForeignKey("pricing_dimension_levels.id", ondelete="CASCADE"), nullable=False, index=True,
    )

    def __repr__(self) -> str:
        return (
            f"<ServiceDimensionSelection service_id={self.service_id} "
            f"dimension_type_id={self.dimension_type_id} dimension_level_id={self.dimension_level_id}>"
        )
