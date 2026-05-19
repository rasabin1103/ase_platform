from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import SubscriptionProvider, SubscriptionStatus


class SubscriptionCreate(BaseModel):
    organization_id: int | None = Field(default=None, ge=1)
    organization_uuid: UUID | None = None
    plan_id: int = Field(ge=1)
    provider: SubscriptionProvider = SubscriptionProvider.manual
    provider_subscription_id: str | None = None
    status: SubscriptionStatus = SubscriptionStatus.active
    starts_at: datetime
    ends_at: datetime | None = None
    trial_ends_at: datetime | None = None


class SubscriptionUpdate(BaseModel):
    organization_id: int | None = Field(default=None, ge=1)
    organization_uuid: UUID | None = None
    plan_id: int | None = Field(default=None, ge=1)
    provider: SubscriptionProvider | None = None
    provider_subscription_id: str | None = None
    status: SubscriptionStatus | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    trial_ends_at: datetime | None = None


class SubscriptionRead(BaseModel):
    id: int
    organization_id: int
    plan_id: int
    provider: SubscriptionProvider
    provider_subscription_id: str | None
    status: SubscriptionStatus
    starts_at: datetime
    ends_at: datetime | None
    trial_ends_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionListResponse(BaseModel):
    items: list[SubscriptionRead]
    limit: int
    offset: int
    total: int

