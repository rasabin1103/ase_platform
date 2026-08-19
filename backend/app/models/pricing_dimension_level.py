from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class PricingDimensionLevel(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """One level of a pricing dimension type (e.g. "Alta" under
    product/Funcionalidad, or "151-300 páginas" under book/Páginas).
    Belongs to exactly one `PricingDimensionType`, which in turn belongs to
    a pillar — so a pillar can have several independent dimensions, each
    with its own set of levels. For range-based types (book/Páginas) the
    level is auto-matched from the item's page_count instead of picked
    manually — min_value/max_value bound it (max_value=None means
    unbounded, i.e. "301+ pages"). See
    app/core/pricing_engine.py:match_dimension_level_for_page_count."""

    __tablename__ = "pricing_dimension_levels"

    dimension_type_id: Mapped[int] = mapped_column(
        ForeignKey("pricing_dimension_types.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    label: Mapped[str] = mapped_column(String(150), nullable=False)
    multiplier: Mapped[Decimal] = mapped_column(Numeric(6, 3), nullable=False, default=Decimal("1.000"))
    # Page-count range bounds (range-based dimension types only) — both
    # inclusive. Ignored for types where the level is picked manually.
    min_value: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_value: Mapped[int | None] = mapped_column(Integer, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    def __repr__(self) -> str:
        return f"<PricingDimensionLevel id={self.id} dimension_type_id={self.dimension_type_id} label={self.label!r}>"
