from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BillingCycle, CatalogItemType, PlanStatus


class PlanFeatureCreate(BaseModel):
    """Create payload for a plan feature line (API field ``text`` maps to DB column ``text``).

    Deprecated: kept only so old data can still be read back via
    ``PlanRead.features``. New/updated plans express what's included via
    ``catalog_item_ids`` instead — see ``PlanCatalogItemRead`` below."""

    text: str = Field(min_length=1)
    display_order: int = 0
    is_active: bool = True


class PlanFeatureRead(BaseModel):
    id: int
    plan_id: int
    text: str = Field(validation_alias="blurb")
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PlanCatalogItemRead(BaseModel):
    """A single "what's included" line, formatted from a real catalog item
    rather than typed by hand — the id/slug let the frontend link straight
    to the item; title/type/short_description are enough to render the
    bullet without a second request."""

    id: int
    catalog_item_id: int
    display_order: int
    title: str
    slug: str
    type: CatalogItemType
    short_description: str

    model_config = ConfigDict(from_attributes=True)


class PlanCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=200)
    billing_cycle: BillingCycle = BillingCycle.monthly
    price: Decimal | None = Field(default=None)
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    is_active: bool = True
    # Primary field for the admin to edit going forward — is_active above is
    # derived from it automatically (see PlansService.create/update) so
    # every is_active-based query keeps working. Sending is_active directly
    # still works for backward compatibility but status, when present,
    # wins.
    status: PlanStatus = PlanStatus.active
    description: str | None = None
    short_description: str | None = Field(default=None, max_length=500)
    display_order: int = 0
    is_recommended: bool = False
    cta_label: str | None = Field(default=None, max_length=200)
    catalog_item_ids: list[int] | None = None
    stripe_price_id: str | None = Field(default=None, max_length=255)
    # English overrides — optional. Left blank, the backend auto-translates
    # name/short_description/description/cta_label from Spanish (see
    # app.core.translation); set any of these to skip auto-translation for
    # that specific field and use the admin's own English text instead.
    name_en: str | None = Field(default=None, max_length=200)
    short_description_en: str | None = Field(default=None, max_length=500)
    description_en: str | None = None
    cta_label_en: str | None = Field(default=None, max_length=200)


class PlanUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    billing_cycle: BillingCycle | None = None
    price: Decimal | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    is_active: bool | None = None
    status: PlanStatus | None = None
    description: str | None = None
    short_description: str | None = Field(default=None, max_length=500)
    display_order: int | None = None
    is_recommended: bool | None = None
    cta_label: str | None = Field(default=None, max_length=200)
    catalog_item_ids: list[int] | None = None
    stripe_price_id: str | None = Field(default=None, max_length=255)
    name_en: str | None = Field(default=None, max_length=200)
    short_description_en: str | None = Field(default=None, max_length=500)
    description_en: str | None = None
    cta_label_en: str | None = Field(default=None, max_length=200)


class PlanRead(BaseModel):
    id: int
    code: str
    name: str
    billing_cycle: BillingCycle
    price: Decimal | None
    currency: str
    is_active: bool
    status: PlanStatus
    created_at: datetime
    updated_at: datetime
    description: str | None = None
    short_description: str | None = None
    display_order: int = 0
    is_recommended: bool = False
    cta_label: str | None = None
    stripe_price_id: str | None = None
    name_en: str | None = None
    short_description_en: str | None = None
    description_en: str | None = None
    cta_label_en: str | None = None
    # Computed, not stored: 12 * monthly price, discounted on a ladder that
    # runs from 3% (cheapest paid plan) to 7% (most expensive paid plan) —
    # see PlansService._paid_discount_ladder. None for the free plan and for
    # custom-priced plans (e.g. Enterprise) with no fixed price to discount.
    annual_price: Decimal | None = None
    # Deprecated free-text bullets — only ever populated for plans created
    # before the catalog-item picker existed. New/edited plans always use
    # included_catalog_items instead.
    features: list[PlanFeatureRead] = Field(default_factory=list)
    included_catalog_items: list[PlanCatalogItemRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PlanListResponse(BaseModel):
    items: list[PlanRead]
    limit: int
    offset: int
    total: int


class TranslationStatus(BaseModel):
    enabled: bool
