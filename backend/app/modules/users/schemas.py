from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserStatus
from app.modules.catalog_admin.schemas import CatalogTestRunConclusionCounts, CatalogTestRunStatusCounts


class UserCreate(BaseModel):
    email: EmailStr
    plain_password: str = Field(min_length=8, max_length=72)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    display_name: str | None = Field(default=None, max_length=150)


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    plain_password: str | None = Field(default=None, min_length=8, max_length=72)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    display_name: str | None = Field(default=None, max_length=150)
    avatar_url: str | None = Field(default=None, max_length=2048)
    status: UserStatus | None = None
    # Admin escape hatch: force-disable 2FA for a user who lost their
    # authenticator device and has no other way back in. Only ever accepts
    # `False` in practice — an admin can't turn 2FA *on* for someone else
    # this way, since that would need the user's own secret/QR scan.
    two_factor_enabled: bool | None = None


class UserRead(BaseModel):
    uuid: UUID
    email: EmailStr
    first_name: str | None
    last_name: str | None
    display_name: str | None
    avatar_url: str | None = None
    status: UserStatus
    email_verified_at: datetime | None
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserListResponse(BaseModel):
    items: list[UserRead]
    limit: int
    offset: int
    total: int


class ImpersonationTokenRead(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    target_email: EmailStr


class UserOrganizationMembershipRead(BaseModel):
    organization_uuid: UUID
    organization_name: str
    organization_type: str
    membership_status: str
    role_codes: list[str] = []


class UserPlanRead(BaseModel):
    """Mirrors the plan-badge resolution in `GET /auth/me` — same "latest
    active/trialing Subscription on the user's default workspace" logic,
    just surfaced here for whichever user a super admin is looking up
    instead of the caller's own account. All-None for a free/no-plan
    account, same as `/me`."""

    plan_code: str | None = None
    plan_name: str | None = None
    plan_name_en: str | None = None
    subscription_status: str | None = None


class UserPurchaseRecentRead(BaseModel):
    catalog_item_title: str
    catalog_item_type: str
    source: str
    purchased_at: datetime


class UserTestRunRecentRead(BaseModel):
    uuid: UUID
    catalog_item_title: str
    status: str
    conclusion: str | None = None
    created_at: datetime


class UserStatsRead(BaseModel):
    """Per-user usage snapshot for the super admin's user detail view —
    deliberately scoped to one specific user (unlike the platform-wide
    admin dashboard aggregates), following the same shape already used for
    `CatalogItemTestStatsRead` (one catalog item's usage) just pivoted onto
    a user instead of a product."""

    user: UserRead
    loyalty_tier: str | None = None
    country: str | None = None
    plan: UserPlanRead
    organizations: list[UserOrganizationMembershipRead] = []
    purchases_total: int
    purchases_recent: list[UserPurchaseRecentRead] = []
    test_runs_total: int
    test_runs_by_status: CatalogTestRunStatusCounts
    test_runs_by_conclusion: CatalogTestRunConclusionCounts
    test_runs_recent: list[UserTestRunRecentRead] = []

