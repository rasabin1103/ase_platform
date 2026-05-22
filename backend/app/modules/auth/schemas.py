from __future__ import annotations

from datetime import datetime
from uuid import UUID

from typing import Literal, Union

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


class LoginRequires2FA(BaseModel):
    requires_2fa: Literal[True] = True
    temporary_login_token: str


LoginResult = Union[TokenPair, LoginRequires2FA]


class RefreshRequest(BaseModel):
    refresh_token: str


class ProfileUpdateRequest(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    display_name: str | None = Field(default=None, max_length=150)
    avatar_url: str | None = Field(default=None, max_length=2048)
    email: EmailStr | None = None
    phone_e164: str | None = Field(default=None, max_length=20)

    @field_validator("phone_e164", mode="before")
    @classmethod
    def validate_phone(cls, value: object) -> str | None:
        if value is None or value == "":
            return None
        return normalize_phone_e164(str(value))


SecurityOnboardingStatusLiteral = Literal[
    "completed",
    "pending_email_verification",
    "pending_mfa_setup",
    "pending_both",
]


class MeResponse(BaseModel):
    id: int | None = None
    uuid: UUID
    email: EmailStr
    first_name: str | None
    last_name: str | None
    display_name: str | None
    avatar_url: str | None = None
    has_avatar: bool = False
    phone_e164: str | None = None
    phone_verified: bool = False
    email_verified: bool = False
    two_factor_enabled: bool = False
    two_factor_confirmed_at: datetime | None = None
    mfa_enabled: bool = False
    mfa_verified_at: datetime | None = None
    security_onboarding_completed_at: datetime | None = None
    security_warning_dismissed_at: datetime | None = None
    security_warning_count: int = 0
    security_onboarding_status: SecurityOnboardingStatusLiteral = "pending_both"
    requires_security_onboarding: bool = True
    can_dismiss_security_warning: bool = True
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
    dashboard_mode: Literal["independent", "organization", "platform_admin"] = "independent"

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


class VerificationSendResponse(BaseModel):
    message: str
    dev_code: str | None = None


class PhoneVerifyConfirmRequest(BaseModel):
    code: str = Field(min_length=6, max_length=6)


class EmailVerifyConfirmResponse(BaseModel):
    message: str
    email: EmailStr


class TwoFactorSetupResponse(BaseModel):
    otpauth_url: str
    manual_key: str


class TwoFactorTotpCodeRequest(BaseModel):
    code: str = Field(min_length=6, max_length=8)


class TwoFactorConfirmResponse(BaseModel):
    recovery_codes: list[str]


class TwoFactorRecoveryCodesResponse(BaseModel):
    recovery_codes: list[str]


class TwoFactorDisableRequest(BaseModel):
    password: str = Field(min_length=1, max_length=72)
    code: str = Field(min_length=6, max_length=8)


class TwoFactorLoginConfirmRequest(BaseModel):
    temporary_login_token: str = Field(min_length=1)
    code: str = Field(min_length=6, max_length=8)

