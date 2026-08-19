from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.enums import PricingPillarCode

# Generous but bounded — protects against fat-fingered multipliers (e.g.
# "50" instead of "1.5") blowing up recommended prices without being so
# tight it blocks legitimate high-end pricing tiers.
_MULTIPLIER = Field(gt=0, le=Decimal("50"))


class PricingDimensionTypeCreate(BaseModel):
    pillar_code: PricingPillarCode
    # Stable machine key within the pillar (e.g. "funcionalidad") — shown
    # nowhere in the UI, just used to keep the seed idempotent.
    code: str = Field(min_length=1, max_length=50, pattern=r"^[a-z0-9_]+$")
    label: str = Field(min_length=1, max_length=150)
    is_range_based: bool = False
    display_order: int = 0
    is_active: bool = True


class PricingDimensionTypeUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=150)
    is_range_based: bool | None = None
    display_order: int | None = None
    is_active: bool | None = None


class PricingDimensionTypeRead(BaseModel):
    id: int
    uuid: UUID
    pillar_code: PricingPillarCode
    code: str
    label: str
    is_range_based: bool
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PricingDimensionTypeListResponse(BaseModel):
    items: list[PricingDimensionTypeRead]


class PricingDimensionLevelCreate(BaseModel):
    dimension_type_id: int
    label: str = Field(min_length=1, max_length=150)
    multiplier: Decimal = _MULTIPLIER
    # Range-based dimension types only (book "Páginas") — the quantity
    # range this level auto-matches (both inclusive; max_value=None means
    # unbounded, e.g. "301+ pages"). Left null for manually-picked types.
    min_value: int | None = Field(default=None, ge=0)
    max_value: int | None = Field(default=None, ge=0)
    display_order: int = 0
    is_active: bool = True

    @model_validator(mode="after")
    def _validate_range(self) -> "PricingDimensionLevelCreate":
        if self.min_value is not None and self.max_value is not None and self.max_value < self.min_value:
            raise ValueError("max_value must be greater than or equal to min_value")
        return self


class PricingDimensionLevelUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=150)
    multiplier: Decimal | None = Field(default=None, gt=0, le=Decimal("50"))
    min_value: int | None = None
    max_value: int | None = None
    display_order: int | None = None
    is_active: bool | None = None


class PricingDimensionLevelRead(BaseModel):
    id: int
    uuid: UUID
    dimension_type_id: int
    label: str
    multiplier: Decimal
    min_value: int | None
    max_value: int | None
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PricingDimensionLevelListResponse(BaseModel):
    items: list[PricingDimensionLevelRead]


class PricingPillarUpdate(BaseModel):
    base_price: Decimal = Field(ge=0)


class PricingDimensionTypeConfig(BaseModel):
    """One dimension type plus every level defined for it."""

    id: int
    uuid: UUID
    code: str
    label: str
    is_range_based: bool
    display_order: int
    is_active: bool
    levels: list[PricingDimensionLevelRead]


class PricingPillarConfig(BaseModel):
    """One pillar's full config — its base price (the hourly rate, for the
    service pillar) and every dimension type (each with its own levels)
    defined for it. Every "subelemento" (subtipo, complejidad,
    funcionalidad...) is a dimension type — there is no separate
    subcategory concept. The admin management page and the
    catalog-item/service creation forms both fetch this in a single call
    (GET /admin/pricing/config) and do the multiplication client-side, so
    live recalculation as the admin changes dropdowns needs no round-trip."""

    code: PricingPillarCode
    base_price: Decimal
    dimension_types: list[PricingDimensionTypeConfig]


class PricingConfigResponse(BaseModel):
    pillars: list[PricingPillarConfig]
