from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import ServiceCategory, ServiceKind, ServicePriceType


class DimensionSelectionInput(BaseModel):
    """One (dimension type, level) pick — a pillar can have several
    dimension types, so a service's full selection is a list of these. See
    app/core/pricing_engine.py."""

    dimension_type_id: int
    dimension_level_id: int


class DimensionSelectionRead(BaseModel):
    dimension_type_id: int
    dimension_level_id: int

    model_config = ConfigDict(from_attributes=True)


class ServiceFeatureCreate(BaseModel):
    text: str = Field(min_length=1)
    display_order: int = 0
    is_active: bool = True


class ServiceFeatureRead(BaseModel):
    id: int
    service_id: int
    text: str = Field(validation_alias="blurb")
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ServiceHighlightCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    value: str = Field(min_length=1, max_length=300)
    description: str | None = None
    display_order: int = 0


class ServiceHighlightRead(BaseModel):
    id: int
    service_id: int
    title: str
    value: str
    description: str | None
    display_order: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ServiceCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=160)
    short_description: str | None = Field(default=None, max_length=500)
    description: str | None = None
    category: ServiceCategory
    service_type: ServiceKind
    price_type: ServicePriceType = ServicePriceType.custom
    # Optional — services historically had no concrete price ("custom" meant
    # "contact us"). Set this to show a real number instead.
    price: Decimal | None = Field(default=None, ge=0)
    is_featured: bool = False
    is_active: bool = True
    display_order: int = 0
    icon: str | None = Field(default=None, max_length=64)
    hero_title: str | None = Field(default=None, max_length=300)
    hero_subtitle: str | None = Field(default=None, max_length=500)
    features: list[ServiceFeatureCreate] | None = None
    highlights: list[ServiceHighlightCreate] | None = None
    # --- Pricing engine (see app/core/pricing_engine.py) — optional. Every
    # "subelemento" (subtipo, complejidad, especialización...) is just a
    # PricingDimensionType, no separate subcategory concept.
    dimension_selections: list[DimensionSelectionInput] = []
    # Drives auto-matching of the range-based "Horas" dimension type —
    # same role as CatalogItem.page_count for books.
    estimated_hours: int | None = Field(default=None, ge=1)


class ServiceUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=160)
    short_description: str | None = Field(default=None, max_length=500)
    description: str | None = None
    category: ServiceCategory | None = None
    service_type: ServiceKind | None = None
    price_type: ServicePriceType | None = None
    price: Decimal | None = Field(default=None, ge=0)
    is_featured: bool | None = None
    is_active: bool | None = None
    display_order: int | None = None
    icon: str | None = Field(default=None, max_length=64)
    hero_title: str | None = Field(default=None, max_length=300)
    hero_subtitle: str | None = Field(default=None, max_length=500)
    features: list[ServiceFeatureCreate] | None = None
    highlights: list[ServiceHighlightCreate] | None = None
    dimension_selections: list[DimensionSelectionInput] | None = None
    estimated_hours: int | None = Field(default=None, ge=1)


class ServiceRead(BaseModel):
    id: int
    uuid: UUID
    code: str
    name: str
    slug: str
    short_description: str | None
    description: str | None
    category: ServiceCategory
    service_type: ServiceKind
    price_type: ServicePriceType
    price: Decimal | None = None
    is_featured: bool
    is_active: bool
    display_order: int
    icon: str | None
    hero_title: str | None
    hero_subtitle: str | None
    created_at: datetime
    updated_at: datetime
    features: list[ServiceFeatureRead] = Field(default_factory=list)
    highlights: list[ServiceHighlightRead] = Field(default_factory=list)
    dimension_selections: list[DimensionSelectionRead] = Field(default_factory=list)
    estimated_hours: int | None = None
    recommended_price: Decimal | None = None

    model_config = ConfigDict(from_attributes=True)


class ServiceListResponse(BaseModel):
    items: list[ServiceRead]
    limit: int
    offset: int
    total: int
