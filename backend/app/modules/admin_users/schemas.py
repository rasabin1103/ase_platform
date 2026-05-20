from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import CreatorStatus, UserStatus

# MVP platform roles; extend ALLOWED_PLATFORM_ROLE_CODES when enabling org_* / creator_user.
MVP_PLATFORM_ROLE_CODES: frozenset[str] = frozenset({"super_admin", "independent_user"})
FUTURE_PLATFORM_ROLE_CODES: frozenset[str] = frozenset(
    {
        "org_owner",
        "org_admin",
        "org_member",
        "creator_user",
        "content_creator",
    }
)


class AdminUserRead(BaseModel):
    id: int
    uuid: UUID
    email: EmailStr
    first_name: str | None
    last_name: str | None
    display_name: str | None
    phone_e164: str | None = None
    status: UserStatus
    primary_role: str | None = None
    roles: list[str] = Field(default_factory=list)
    avatar_url: str | None = None
    can_create_content: bool = False
    creator_status: CreatorStatus = CreatorStatus.none
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None = None


class AdminUserListResponse(BaseModel):
    items: list[AdminUserRead]
    limit: int
    offset: int
    total: int


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    display_name: str | None = Field(default=None, max_length=150)
    status: UserStatus = UserStatus.active
    role: str = Field(min_length=1, max_length=64)
    can_create_content: bool = False
    creator_status: CreatorStatus = CreatorStatus.none


class AdminUserUpdate(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    display_name: str | None = Field(default=None, max_length=150)
    phone_e164: str | None = Field(default=None, max_length=20)
    avatar_url: str | None = Field(default=None, max_length=2048)
    role: str | None = Field(default=None, max_length=64)
    status: UserStatus | None = None
    can_create_content: bool | None = None
    creator_status: CreatorStatus | None = None


class AdminUserStatusPatch(BaseModel):
    status: UserStatus
