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
from app.modules.auth.schemas import (
    LoginRequest,
    MeResponse,
    ProfileUpdateRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    WorkspaceListResponse,
    WorkspaceRead,
)
from app.modules.auth.service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def get_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


@router.post("/register", response_model=MeResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, svc: AuthService = Depends(get_service)):
    return svc.register(payload)


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, svc: AuthService = Depends(get_service)):
    tokens = svc.login(payload)
    logger.info("login_success email=%s token_generated=true", str(payload.email))
    return tokens


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, svc: AuthService = Depends(get_service)):
    return svc.refresh(payload.refresh_token)


@router.get("/me", response_model=MeResponse)
def me(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logger.info("current_user_requested email=%s", user.email)
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
    body = profile.model_copy(
        update={
            "avatar_url": resolve_user_avatar_url(user),
            "has_avatar": user_has_stored_avatar(user),
            "phone_verified": user.phone_verified_at is not None,
            "two_factor_enabled": bool(user.two_factor_enabled),
            "organization_uuid": organization_uuid,
            "active_workspace_uuid": active_workspace_uuid,
            "is_superuser": is_superuser,
            **rbac,
        }
    )
    logger.info(
        "current_user_resolved email=%s primary_role=%s role_codes=%s",
        str(body.email),
        body.primary_role,
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

