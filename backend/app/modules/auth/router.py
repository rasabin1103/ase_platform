from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.exc import IntegrityError
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.media_storage import validate_image_upload
from app.core.media_urls import resolve_user_avatar_url, user_has_stored_avatar
from app.models.enums import MembershipStatus, OrganizationStatus, OrganizationType
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.modules.auth.dependencies import (
    require_permission,
    get_current_user,
    get_default_organization_id,
    get_default_organization_uuid,
)
from app.modules.auth.me_builder import build_me_response
from app.modules.auth.schemas import (
    EmailVerifyConfirmResponse,
    LoginRequest,
    LoginResult,
    MeResponse,
    PhoneVerifyConfirmRequest,
    ProfileUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    TwoFactorConfirmResponse,
    TwoFactorDisableRequest,
    TwoFactorLoginConfirmRequest,
    TwoFactorRecoveryCodesResponse,
    TwoFactorSetupResponse,
    TwoFactorTotpCodeRequest,
    VerificationSendResponse,
    WorkspaceListResponse,
    WorkspaceRead,
)
from app.modules.auth.service import AuthService
from app.modules.auth.security_onboarding import (
    dismiss_security_warning,
    ensure_security_onboarding_complete,
    sync_security_onboarding_completed_at,
)
from app.modules.auth.two_factor_service import TwoFactorService
from app.modules.auth.verification_service import VerificationService
from app.modules.notifications.schemas import EmailVerifyRequest, NotificationMessageResponse
from app.modules.notifications.service import NotificationService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def get_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_verification_service(db: Session = Depends(get_db)) -> VerificationService:
    return VerificationService(db)


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    return NotificationService(db)


def get_two_factor_service(db: Session = Depends(get_db)) -> TwoFactorService:
    return TwoFactorService(db)


@router.post("/register", response_model=MeResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    request: Request,
    svc: AuthService = Depends(get_service),
    db: Session = Depends(get_db),
):
    user = svc.register(payload)
    return build_me_response(request, user, db)


@router.post("/login", response_model=LoginResult)
def login(payload: LoginRequest, svc: AuthService = Depends(get_service)):
    result = svc.login(payload)
    if isinstance(result, TokenPair):
        logger.info("login_success email=%s token_generated=true", str(payload.email))
    else:
        logger.info("login_requires_2fa email=%s", str(payload.email))
    return result


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, svc: AuthService = Depends(get_service)):
    return svc.refresh(payload.refresh_token)


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def two_factor_setup(
    user: User = Depends(get_current_user),
    svc: TwoFactorService = Depends(get_two_factor_service),
):
    return svc.setup(user)


@router.post("/2fa/confirm", response_model=TwoFactorConfirmResponse)
def two_factor_confirm(
    payload: TwoFactorTotpCodeRequest,
    user: User = Depends(get_current_user),
    svc: TwoFactorService = Depends(get_two_factor_service),
):
    return svc.confirm(user, payload)


@router.post("/2fa/disable", status_code=status.HTTP_204_NO_CONTENT)
def two_factor_disable(
    payload: TwoFactorDisableRequest,
    user: User = Depends(get_current_user),
    svc: TwoFactorService = Depends(get_two_factor_service),
):
    svc.disable(user, payload)


@router.post("/2fa/recovery-codes/regenerate", response_model=TwoFactorRecoveryCodesResponse)
def two_factor_regenerate_recovery_codes(
    payload: TwoFactorTotpCodeRequest,
    user: User = Depends(get_current_user),
    svc: TwoFactorService = Depends(get_two_factor_service),
):
    return svc.regenerate_recovery_codes(user, payload)


@router.post("/2fa/login-confirm", response_model=TokenPair)
def two_factor_login_confirm(
    payload: TwoFactorLoginConfirmRequest,
    svc: TwoFactorService = Depends(get_two_factor_service),
):
    return svc.login_confirm(payload)


@router.post("/security-warning/dismiss", response_model=MeResponse)
def dismiss_security_warning_endpoint(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dismiss_security_warning(user)
    db.commit()
    db.refresh(user)
    return build_me_response(request, user, db)


@router.get("/me", response_model=MeResponse)
def me(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logger.info("current_user_requested email=%s", user.email)
    body = build_me_response(request, user, db)
    logger.info(
        "current_user_resolved email=%s primary_role=%s dashboard_mode=%s role_codes=%s",
        str(body.email),
        body.primary_role,
        body.dashboard_mode,
        ",".join(body.role_codes) if body.role_codes else "",
    )
    return body


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
    return Response(content=_avatar_bytes(user), media_type=user.avatar_mime or "image/jpeg")


@router.get("/users/{user_uuid}/avatar")
def get_user_avatar(user_uuid: UUID, db: Session = Depends(get_db)):
    user = db.execute(select(User).where(User.uuid == user_uuid)).scalar_one_or_none()
    if user is None or not user_has_stored_avatar(user):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")
    return Response(content=_avatar_bytes(user), media_type=user.avatar_mime or "image/jpeg")


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
    if "email" in data and str(data["email"]).lower() != user.email.lower():
        ensure_security_onboarding_complete(user)
        user.email_verified_at = None
        sync_security_onboarding_completed_at(user)
    for key, value in data.items():
        setattr(user, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        orig = str(exc.orig).lower()
        if "phone_e164" in orig or "ix_users_phone_e164" in orig:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already in use") from exc
        if "email" in orig or "ix_users_email" in orig:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use") from exc
        raise
    db.refresh(user)
    return me(request, user, db)


@router.post(
    "/email/resend-verification",
    response_model=NotificationMessageResponse,
    dependencies=[Depends(require_permission("profile.update_self"))],
)
def resend_email_verification(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    svc: NotificationService = Depends(get_notification_service),
):
    from app.modules.notifications.service import VERIFICATION_EMAIL_SENT_MESSAGE

    svc.send_email_verification(user)
    db.commit()
    return NotificationMessageResponse(message=VERIFICATION_EMAIL_SENT_MESSAGE)


@router.post("/email/verify", response_model=EmailVerifyConfirmResponse)
def verify_email_with_token(
    payload: EmailVerifyRequest,
    db: Session = Depends(get_db),
    svc: NotificationService = Depends(get_notification_service),
):
    user = svc.verify_email_token(payload.token)
    db.commit()
    return EmailVerifyConfirmResponse(message="email_verified", email=user.email)


@router.post(
    "/me/verify/email/send",
    response_model=VerificationSendResponse,
    dependencies=[Depends(require_permission("profile.update_self"))],
)
def send_email_verification_legacy(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    svc: NotificationService = Depends(get_notification_service),
):
    from app.modules.notifications.service import VERIFICATION_EMAIL_SENT_MESSAGE

    svc.send_email_verification(user)
    db.commit()
    return VerificationSendResponse(message=VERIFICATION_EMAIL_SENT_MESSAGE)


@router.get("/verify/email", response_model=EmailVerifyConfirmResponse)
def confirm_email_verification(
    token: str,
    db: Session = Depends(get_db),
    svc: NotificationService = Depends(get_notification_service),
):
    user = svc.verify_email_token(token)
    db.commit()
    return EmailVerifyConfirmResponse(message="email_verified", email=user.email)


@router.post(
    "/me/verify/phone/send",
    response_model=VerificationSendResponse,
    dependencies=[Depends(require_permission("profile.update_self"))],
)
def send_phone_verification(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    svc: VerificationService = Depends(get_verification_service),
):
    result = svc.send_phone_verification(user)
    db.commit()
    return VerificationSendResponse(**result)


@router.post(
    "/me/verify/phone/confirm",
    response_model=MeResponse,
    dependencies=[Depends(require_permission("profile.update_self"))],
)
def confirm_phone_verification(
    payload: PhoneVerifyConfirmRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    svc: VerificationService = Depends(get_verification_service),
):
    svc.confirm_phone_code(user, payload.code)
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

