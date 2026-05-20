from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import CatalogItemType, PricingBillingInterval, PricingPlanType, PricingSupportLevel


class PricingPlanRead(BaseModel):
    id: int
    catalog_item_id: int
    name: str
    slug: str
    description: str | None = None
    plan_type: PricingPlanType
    billing_interval: PricingBillingInterval
    price: Decimal
    currency: str
    trial_days: int | None = None
    setup_fee: Decimal | None = None
    discount_percentage: Decimal | None = None
    is_active: bool
    is_default: bool
    max_users: int | None = None
    max_downloads: int | None = None
    access_duration_days: int | None = None
    includes_updates: bool
    includes_support: bool
    support_level: PricingSupportLevel
    features: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    stripe_price_id: str | None = None
    stripe_product_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PricingPlanListResponse(BaseModel):
    items: list[PricingPlanRead]
    catalog_item_id: int


class PricingPlanWithCatalogRead(PricingPlanRead):
    catalog_item_title: str
    catalog_item_slug: str
    catalog_item_type: CatalogItemType


class AdminPricingPlanListResponse(BaseModel):
    items: list[PricingPlanWithCatalogRead]
    limit: int
    offset: int
    total: int


class PricingPlanCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    description: str | None = None
    plan_type: PricingPlanType
    billing_interval: PricingBillingInterval = PricingBillingInterval.none
    price: Decimal = Field(default=Decimal("0.00"), ge=0)
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    trial_days: int | None = Field(default=None, ge=0)
    setup_fee: Decimal | None = Field(default=None, ge=0)
    discount_percentage: Decimal | None = Field(default=None, ge=0, le=100)
    is_active: bool = True
    is_default: bool = False
    max_users: int | None = Field(default=None, ge=0)
    max_downloads: int | None = Field(default=None, ge=0)
    access_duration_days: int | None = Field(default=None, ge=0)
    includes_updates: bool = False
    includes_support: bool = False
    support_level: PricingSupportLevel = PricingSupportLevel.none
    features: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class PricingPlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=160)
    description: str | None = None
    plan_type: PricingPlanType | None = None
    billing_interval: PricingBillingInterval | None = None
    price: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    trial_days: int | None = Field(default=None, ge=0)
    setup_fee: Decimal | None = Field(default=None, ge=0)
    discount_percentage: Decimal | None = Field(default=None, ge=0, le=100)
    is_active: bool | None = None
    is_default: bool | None = None
    max_users: int | None = Field(default=None, ge=0)
    max_downloads: int | None = Field(default=None, ge=0)
    access_duration_days: int | None = Field(default=None, ge=0)
    includes_updates: bool | None = None
    includes_support: bool | None = None
    support_level: PricingSupportLevel | None = None
    features: list[str] | None = None
    limitations: list[str] | None = None


class PricingPlanStatusPatch(BaseModel):
    is_active: bool


class PublicPricingPlanRead(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None = None
    planType: PricingPlanType
    billingInterval: PricingBillingInterval
    price: Decimal
    currency: str
    trialDays: int | None = None
    setupFee: Decimal | None = None
    discountPercentage: Decimal | None = None
    isDefault: bool
    maxUsers: int | None = None
    maxDownloads: int | None = None
    accessDurationDays: int | None = None
    includesUpdates: bool
    includesSupport: bool
    supportLevel: PricingSupportLevel
    features: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
