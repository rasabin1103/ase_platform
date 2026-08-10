from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.phone import normalize_phone_e164

from app.models.enums import CreatorStatus, UserStatus


class RegisterRequest(BaseModel):
    email: EmailStr
    plain_password: str = Field(min_length=8, max_length=72)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    display_name: str | None = Field(default=None, max_length=150)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ProfileUpdateRequest(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    display_name: str | None = Field(default=None, max_length=150)
    avatar_url: str | None = Field(default=None, max_length=2048)
    phone_e164: str | None = Field(default=None, max_length=20)

    @field_validator("phone_e164", mode="before")
    @classmethod
    def validate_phone(cls, value: object) -> str | None:
        if value is None or value == "":
            return None
        return normalize_phone_e164(str(value))


class MeResponse(BaseModel):
    uuid: UUID
    email: EmailStr
    first_name: str | None
    last_name: str | None
    display_name: str | None
    avatar_url: str | None = None
    has_avatar: bool = False
    phone_e164: str | None = None
    phone_verified: bool = False
    two_factor_enabled: bool = False
    can_create_content: bool = False
    creator_status: CreatorStatus = CreatorStatus.none
    status: UserStatus
    email_verified_at: datetime | None
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime
    # Tenant header helper (first active membership). No DB column on User — computed on GET /me.
    organization_uuid: UUID | None = None
    # True when user holds platform ``super_admin`` via member_roles (no ``users.is_superuser`` column).
    is_superuser: bool = False
    role_codes: list[str] = []
    permissions: list[str] = []
    primary_role: str | None = None
    is_independent_user: bool = False
    consumer_mode: bool = False
    active_workspace_uuid: UUID | None = None

    model_config = {"from_attributes": True}


class WorkspaceRead(BaseModel):
    uuid: UUID
    name: str
    slug: str
    type: str
    is_default: bool = False


class WorkspaceListResponse(BaseModel):
    items: list[WorkspaceRead]
    default_workspace_uuid: UUID | None = None

