from __future__ import annotations

from decimal import Decimal

from sqlalchemy import Enum, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.enums import PricingPillarCode
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin


class PricingPillar(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """The admin-configurable base price for one of the 5 fixed pricing
    pillars (product/course/book/resource/service). Rows are never created
    or deleted through the API — PricingAdminService.list_pillars()
    idempotently inserts any missing pillar codes with base_price=0 on
    first read, so this table always self-heals to exactly 5 rows
    regardless of migration timing across environments."""

    __tablename__ = "pricing_pillars"

    code: Mapped[PricingPillarCode] = mapped_column(
        Enum(PricingPillarCode, name="pricing_pillar_code", native_enum=True),
        unique=True,
        nullable=False,
        index=True,
    )
    base_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))

    def __repr__(self) -> str:
        return f"<PricingPillar code={self.code.value} base_price={self.base_price}>"
