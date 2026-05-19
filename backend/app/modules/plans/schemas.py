from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BillingCycle


class PlanFeatureCreate(BaseModel):
    """Create payload for a plan feature line (API field ``text`` maps to DB column ``text``)."""

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


class PlanCreate(BaseModel):
    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=200)
    billing_cycle: BillingCycle = BillingCycle.monthly
    price: Decimal | None = Field(default=None)
    currency: str = Field(default="EUR", min_length=3, max_length=3)
    is_active: bool = True
    description: str | None = None
    short_description: str | None = Field(default=None, max_length=500)
    display_order: int = 0
    is_recommended: bool = False
    cta_label: str | None = Field(default=None, max_length=200)
    features: list[PlanFeatureCreate] | None = None


class PlanUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=200)
    billing_cycle: BillingCycle | None = None
    price: Decimal | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    is_active: bool | None = None
    description: str | None = None
    short_description: str | None = Field(default=None, max_length=500)
    display_order: int | None = None
    is_recommended: bool | None = None
    cta_label: str | None = Field(default=None, max_length=200)
    features: list[PlanFeatureCreate] | None = None


class PlanRead(BaseModel):
    id: int
    code: str
    name: str
    billing_cycle: BillingCycle
    price: Decimal | None
    currency: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    description: str | None = None
    short_description: str | None = None
    display_order: int = 0
    is_recommended: bool = False
    cta_label: str | None = None
    features: list[PlanFeatureRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PlanListResponse(BaseModel):
    items: list[PlanRead]
    limit: int
    offset: int
    total: int
