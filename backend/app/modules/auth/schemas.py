from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.core.phone import normalize_phone_e164

from app.models.enums import CreatorStatus, LoyaltyTier, UserStatus


class UserLinkIn(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    url: str = Field(min_length=1, max_length=2048)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        v = value.strip()
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

    @field_validator("label")
    @classmethod
    def validate_label(cls, value: str) -> str:
        v = value.strip()
        if not v:
            raise ValueError("Label cannot be empty")
        return v


class UserLinkRead(BaseModel):
    id: int
    label: str
    url: str
    display_order: int

    model_config = {"from_attributes": True}


class UserLinksReplaceRequest(BaseModel):
    items: list[UserLinkIn] = Field(default_factory=list, max_length=20)


class RegisterRequest(BaseModel):
    email: EmailStr
    plain_password: str = Field(min_length=8, max_length=72)
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    display_name: str | None = Field(default=None, max_length=150)
    # ISO 3166-1 alpha-2, e.g. "ES" — required for every new signup (see
    # frontend/src/data/countries.ts for the picker). Feeds admin metrics on
    # where users are signing up from.
    country: str = Field(min_length=2, max_length=2)
    # 'es' or 'en' — whichever language the registration form was in (see
    # frontend/src/i18n). Stored on the account so every future transactional
    # email goes out in the language the person actually reads.
    preferred_language: str = Field(default="es", min_length=2, max_length=2)

    @field_validator("country")
    @classmethod
    def validate_country(cls, value: str) -> str:
        v = value.strip().upper()
        if len(v) != 2 or not v.isalpha():
            raise ValueError("country must be a 2-letter ISO 3166-1 code")
        return v

    @field_validator("preferred_language")
    @classmethod
    def validate_preferred_language(cls, value: str) -> str:
        v = value.strip().lower()
        return v if v in ("es", "en") else "es"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    # True when the account is still suspended pending mandatory 2FA setup
    # (see AuthService.login) — a real session is issued so the frontend can
    # reach /auth/2fa/setup + /auth/2fa/confirm, but every other endpoint
    # keeps rejecting the account until 2FA is confirmed.
    requires_two_factor_setup: bool = False


class TwoFactorRequiredResponse(BaseModel):
    """Returned by POST /auth/login instead of TokenPair when the account
    has 2FA enabled — no real session token is issued until the code in
    `challenge_token` is verified via POST /auth/2fa/verify-login."""

    two_factor_required: bool = True
    challenge_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TwoFactorSetupResponse(BaseModel):
    secret: str
    otpauth_uri: str
    qr_code_data_uri: str


class TwoFactorConfirmSchema(BaseModel):
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class TwoFactorDisableSchema(BaseModel):
    password: str = Field(min_length=1, max_length=72)


class TwoFactorVerifyLoginSchema(BaseModel):
    challenge_token: str
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class PasswordResetRequestSchema(BaseModel):
    email: EmailStr


class PasswordResetConfirmSchema(BaseModel):
    token: str = Field(min_length=1, max_length=512)
    new_password: str = Field(min_length=8, max_length=72)


class EmailVerificationConfirmSchema(BaseModel):
    token: str = Field(min_length=1, max_length=512)


class SimpleMessageResponse(BaseModel):
    ok: bool = True


class ProfileUpdateRequest(BaseModel):
    first_name: str | None = Field(default=None, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    display_name: str | None = Field(default=None, max_length=150)
    avatar_url: str | None = Field(default=None, max_length=2048)
    phone_e164: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, min_length=2, max_length=2)
    newsletter_subscribed: bool | None = None

    @field_validator("country")
    @classmethod
    def validate_country(cls, value: str | None) -> str | None:
        if value is None:
            return None
        v = value.strip().upper()
        if len(v) != 2 or not v.isalpha():
            raise ValueError("country must be a 2-letter ISO 3166-1 code")
        return v

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
    country: str | None = None
    phone_e164: str | None = None
    phone_verified: bool = False
    two_factor_enabled: bool = False
    can_create_content: bool = False
    creator_status: CreatorStatus = CreatorStatus.none
    status: UserStatus
    # Only meaningful when status == 'suspended' — distinguishes an
    # automated lifecycle suspension (see app/core/account_lifecycle.py)
    # from a manual admin suspension (null in that case).
    suspension_reason: str | None = None
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
    links: list[UserLinkRead] = []
    # Current plan for the user's default workspace, resolved from the
    # latest active/trialing Subscription — null for free/no-plan accounts.
    plan_code: str | None = None
    plan_name: str | None = None
    plan_name_en: str | None = None
    subscription_status: str | None = None
    # Loyalty reward tier from subscriber tenure — see app/core/loyalty.py.
    # Null means no tier yet (never subscribed, or under 6 months).
    loyalty_tier: LoyaltyTier | None = None
    # Weekly newsletter opt-in — see app/core/newsletter.py.
    newsletter_subscribed: bool = False

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

