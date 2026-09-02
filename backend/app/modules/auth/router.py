from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.exc import IntegrityError
from fastapi.responses import Response
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.media_storage import validate_image_upload
from app.core.media_urls import resolve_user_avatar_url, user_has_stored_avatar
from app.core.rate_limit import limiter
from app.core.turnstile import verify_turnstile_token
from app.models.enums import MembershipStatus, OrganizationStatus, OrganizationType, SubscriptionStatus
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.core.rbac import resolve_primary_role
from app.models.role import Role
from app.models.member_role import MemberRole
from app.modules.auth.dependencies import (
    require_permission,
    _resolve_org_id_from_request,
    get_current_user,
    get_default_organization_id,
    get_default_organization_uuid,
    get_rbac_context,
    get_user_role_codes,
    is_independent_user,
    user_has_role_assigned,
)
from app.models.user_link import UserLink
from app.modules.auth.schemas import (
    EmailVerificationConfirmSchema,
    LoginRequest,
    MeResponse,
    PasswordResetConfirmSchema,
    PasswordResetRequestSchema,
    ProfileUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    SimpleMessageResponse,
    TokenPair,
    TwoFactorConfirmSchema,
    TwoFactorDisableSchema,
    TwoFactorRequiredResponse,
    TwoFactorSetupResponse,
    TwoFactorVerifyLoginSchema,
    UserLinkRead,
    UserLinksReplaceRequest,
    WorkspaceListResponse,
    WorkspaceRead,
)
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def get_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/register", response_model=MeResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def register(request: Request, payload: RegisterRequest, svc: AuthService = Depends(get_service)):
    remote_ip = request.client.host if request.client else None
    if not await verify_turnstile_token(payload.turnstile_token, remote_ip):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="captcha_failed")
    return svc.register(payload)


@router.post("/login", response_model=TokenPair | TwoFactorRequiredResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, svc: AuthService = Depends(get_service)):
    return svc.login(payload)


@router.post("/2fa/verify-login", response_model=TokenPair)
@limiter.limit("10/minute")
def verify_login_two_factor(
    request: Request, payload: TwoFactorVerifyLoginSchema, svc: AuthService = Depends(get_service),
):
    return svc.verify_login_two_factor(challenge_token=payload.challenge_token, code=payload.code)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, svc: AuthService = Depends(get_service)):
    return svc.refresh(payload.refresh_token)


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_two_factor(user: User = Depends(get_current_user), svc: AuthService = Depends(get_service)):
    return svc.setup_two_factor(user)


@router.post("/2fa/confirm", response_model=SimpleMessageResponse)
def confirm_two_factor(
    payload: TwoFactorConfirmSchema, user: User = Depends(get_current_user), svc: AuthService = Depends(get_service),
):
    svc.confirm_two_factor(user, code=payload.code)
    return SimpleMessageResponse()


@router.post("/2fa/disable", response_model=SimpleMessageResponse)
def disable_two_factor(
    payload: TwoFactorDisableSchema, user: User = Depends(get_current_user), svc: AuthService = Depends(get_service),
):
    svc.disable_two_factor(user, password=payload.password)
    return SimpleMessageResponse()


@router.post("/password-reset/request", response_model=SimpleMessageResponse)
@limiter.limit("5/hour")
def request_password_reset(
    request: Request, payload: PasswordResetRequestSchema, svc: AuthService = Depends(get_service),
):
    """Always returns ok — whether or not the email exists — so this can
    never be used to check which addresses are registered."""
    svc.request_password_reset(str(payload.email))
    return SimpleMessageResponse()


@router.post("/password-reset/confirm", response_model=SimpleMessageResponse)
@limiter.limit("10/hour")
def confirm_password_reset(
    request: Request, payload: PasswordResetConfirmSchema, svc: AuthService = Depends(get_service),
):
    svc.confirm_password_reset(raw_token=payload.token, new_password=payload.new_password)
    return SimpleMessageResponse()


@router.post("/email-verification/resend", response_model=SimpleMessageResponse)
@limiter.limit("5/hour")
def resend_email_verification(
    request: Request, user: User = Depends(get_current_user), svc: AuthService = Depends(get_service),
):
    svc.resend_verification_email(user)
    return SimpleMessageResponse()


@router.post("/email-verification/confirm", response_model=SimpleMessageResponse)
@limiter.limit("20/hour")
def confirm_email_verification(
    request: Request, payload: EmailVerificationConfirmSchema, svc: AuthService = Depends(get_service),
):
    svc.confirm_email_verification(payload.token)
    return SimpleMessageResponse()


@router.get("/me", response_model=MeResponse)
def me(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = MeResponse.model_validate(user)
    organization_uuid = db.execute(
        select(Organization.uuid)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.membership_status == MembershipStatus.active,
            Organization.status == OrganizationStatus.active,
        )
        .order_by(OrganizationMember.id.asc())
        .limit(1)
    ).scalar_one_or_none()
    org_id = _resolve_org_id_from_request(request, db)
    global_independent = is_independent_user(db, user)

    if global_independent:
        personal_org_id = db.execute(
            select(Organization.id)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .join(MemberRole, MemberRole.organization_member_id == OrganizationMember.id)
            .join(Role, Role.id == MemberRole.role_id)
            .where(
                OrganizationMember.user_id == user.id,
                OrganizationMember.membership_status == MembershipStatus.active,
                Organization.status == OrganizationStatus.active,
                Organization.type == OrganizationType.individual,
                Role.code == "independent_user",
            )
            .order_by(OrganizationMember.id.asc())
            .limit(1)
        ).scalar_one_or_none()
        ctx_org_id = personal_org_id or org_id
    else:
        ctx_org_id = org_id

    rbac = get_rbac_context(db, user, organization_id=ctx_org_id)
    if global_independent:
        global_roles = get_user_role_codes(db, user_id=user.id, organization_id=None)
        rbac = {
            **rbac,
            "role_codes": global_roles,
            "primary_role": resolve_primary_role(global_roles),
            "is_independent_user": True,
            "consumer_mode": True,
        }
    else:
        rbac = {**rbac, "consumer_mode": False}

    is_superuser = user_has_role_assigned(db, user_id=user.id, role_code="super_admin")
    active_workspace_uuid = get_default_organization_uuid(db, user)
    links = [UserLinkRead.model_validate(link) for link in user.links]

    # Plan badge — resolved from the latest active/trialing Subscription on
    # the user's default workspace. Free/no-plan accounts get all-None here.
    plan_code = plan_name = plan_name_en = subscription_status = None
    plan_org_id = get_default_organization_id(db, user)
    if plan_org_id is not None:
        plan_row = db.execute(
            select(Plan, Subscription.status)
            .join(Subscription, Subscription.plan_id == Plan.id)
            .where(
                Subscription.organization_id == plan_org_id,
                Subscription.status.in_([SubscriptionStatus.active, SubscriptionStatus.trialing]),
            )
            .order_by(Subscription.created_at.desc())
            .limit(1)
        ).first()
        if plan_row is not None:
            plan, sub_status = plan_row
            plan_code = plan.code
            plan_name = plan.name
            plan_name_en = plan.name_en
            subscription_status = sub_status.value

    return profile.model_copy(
        update={
            "avatar_url": resolve_user_avatar_url(user),
            "has_avatar": user_has_stored_avatar(user),
            "phone_verified": user.phone_verified_at is not None,
            "two_factor_enabled": bool(user.two_factor_enabled),
            "organization_uuid": organization_uuid,
            "active_workspace_uuid": active_workspace_uuid,
            "is_superuser": is_superuser,
            "links": links,
            "plan_code": plan_code,
            "plan_name": plan_name,
            "plan_name_en": plan_name_en,
            "subscription_status": subscription_status,
            "loyalty_tier": user.loyalty_tier,
            **rbac,
        }
    )


@router.post(
    "/me/avatar",
    response_model=MeResponse,
    dependencies=[Depends(require_permission("profile.update_self"))],
)
async def upload_my_avatar(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = await file.read()
    try:
        mime = validate_image_upload(content, file.content_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    user.avatar_data = bytes(content)
    user.avatar_mime = mime
    db.add(user)
    db.commit()
    db.refresh(user)
    return me(request, user, db)


def _avatar_bytes(user: User) -> bytes:
    data = user.avatar_data
    if data is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")
    if isinstance(data, memoryview):  # noqa: A001
        return data.tobytes()
    return bytes(data)


@router.get("/me/avatar")
def get_my_avatar(user: User = Depends(get_current_user)):
    if not user_has_stored_avatar(user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")
    # Own avatar barely changes and gets requested on every authenticated
    # page (header, profile menu, etc.) — caching it is one of the bigger
    # levers against repeat Supabase DB egress. "private" (not "public")
    # since this is served from an authenticated, per-caller endpoint.
    return Response(
        content=_avatar_bytes(user),
        media_type=user.avatar_mime or "image/jpeg",
        headers={"Cache-Control": "private, max-age=86400"},
    )


@router.get("/users/{user_uuid}/avatar")
def get_user_avatar(user_uuid: UUID, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.uuid == user_uuid)).scalar_one_or_none()
    if user is None or not user_has_stored_avatar(user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")
    # No-auth endpoint (other people's avatars show up in comments, team
    # lists, admin user lists, etc.) — safe to cache publicly.
    return Response(
        content=_avatar_bytes(user),
        media_type=user.avatar_mime or "image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.patch("/me", response_model=MeResponse)
def update_me(
    payload: ProfileUpdateRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)
    # Avatar binary is managed only via POST /me/avatar — ignore URL-only updates.
    data.pop("avatar_url", None)
    if "phone_e164" in data and data["phone_e164"] != user.phone_e164:
        user.phone_verified_at = None
        if user.two_factor_enabled and data["phone_e164"] is None:
            user.two_factor_enabled = False
    for key, value in data.items():
        setattr(user, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        if "phone_e164" in str(exc.orig).lower() or "ix_users_phone_e164" in str(exc.orig).lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already in use") from exc
        raise
    db.refresh(user)
    return me(request, user, db)


@router.put(
    "/me/links",
    response_model=MeResponse,
    dependencies=[Depends(require_permission("profile.update_self"))],
)
def replace_my_links(
    payload: UserLinksReplaceRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.execute(delete(UserLink).where(UserLink.user_id == user.id))
    for i, item in enumerate(payload.items):
        db.add(UserLink(user_id=user.id, label=item.label, url=item.url, display_order=i))
    db.commit()
    db.refresh(user)
    return me(request, user, db)


@router.get("/workspaces", response_model=WorkspaceListResponse)
def list_workspaces(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    default_id = get_default_organization_id(db, user)
    default_uuid = get_default_organization_uuid(db, user)
    rows = db.execute(
        select(Organization)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.membership_status == MembershipStatus.active,
            Organization.status == OrganizationStatus.active,
        )
        .order_by(OrganizationMember.id.asc())
    ).scalars().all()
    items = [
        WorkspaceRead(
            uuid=org.uuid,
            name=org.name,
            slug=org.slug,
            type=org.type.value if hasattr(org.type, "value") else str(org.type),
            is_default=org.id == default_id,
        )
        for org in rows
    ]
    return WorkspaceListResponse(items=items, default_workspace_uuid=default_uuid)

