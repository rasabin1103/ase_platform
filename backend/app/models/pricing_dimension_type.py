from __future__ import annotations

from sqlalchemy import Boolean, Enum, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import PricingPillarCode
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class PricingDimensionType(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """A named pricing axis within one pillar (e.g. "Funcionalidad" and
    "Mantenimiento" under product; "Duración" and "Especialización" under
    course). Each pillar can have several of these — unlike the old single
    generic "complexity" dimension. `PricingDimensionLevel` rows hang off a
    dimension type via `dimension_type_id` instead of directly off the
    pillar. `is_range_based=True` marks the one case (book "Páginas") whose
    level is auto-matched from a quantity (page_count) rather than picked
    manually — see app/core/pricing_engine.py."""

    __tablename__ = "pricing_dimension_types"
    __table_args__ = (UniqueConstraint("pillar_code", "code", name="uq_pricing_dimension_types_pillar_code_code"),)

    pillar_code: Mapped[PricingPillarCode] = mapped_column(
        Enum(PricingPillarCode, name="pricing_pillar_code", native_enum=True),
        nullable=False,
        index=True,
    )
    # Stable machine key within the pillar (e.g. "funcionalidad") — used by
    # the idempotent seed to recognize types that already exist.
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    label: Mapped[str] = mapped_column(String(150), nullable=False)
    is_range_based: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)

    def __repr__(self) -> str:
        return f"<PricingDimensionType id={self.id} pillar={self.pillar_code.value} code={self.code!r}>"
