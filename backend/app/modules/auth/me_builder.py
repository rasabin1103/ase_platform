from __future__ import annotations

from fastapi import Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.media_urls import resolve_user_avatar_url, user_has_stored_avatar
from app.core.rbac import resolve_primary_role
from app.models.enums import MembershipStatus, OrganizationStatus, OrganizationType
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User
from app.modules.auth.dependencies import (
    _resolve_org_id_from_request,
    get_default_organization_uuid,
    get_rbac_context,
    get_user_role_codes,
    is_independent_user,
    is_super_admin,
    user_has_role_assigned,
)
from app.modules.auth.platform_roles import user_has_platform_role
from app.modules.auth.schemas import MeResponse
from app.modules.auth.security_onboarding import security_onboarding_fields


def resolve_dashboard_mode(
    db: Session,
    user: User,
    *,
    organization_uuid,
    global_independent: bool,
) -> str:
    if is_super_admin(db, user):
        return "platform_admin"
    if global_independent and organization_uuid is None:
        return "independent"
    if organization_uuid is not None:
        return "organization"
    if global_independent:
        return "independent"
    return "organization"


def build_me_response(request: Request, user: User, db: Session) -> MeResponse:
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
    dashboard_mode = resolve_dashboard_mode(
        db,
        user,
        organization_uuid=organization_uuid,
        global_independent=global_independent,
    )

    org_free_independent = (
        global_independent
        and organization_uuid is None
        and user_has_platform_role(db, user_id=user.id, role_code="independent_user")
    )
    if org_free_independent:
        organization_uuid = None
        active_workspace_uuid = None

    return profile.model_copy(
        update={
            "avatar_url": resolve_user_avatar_url(user),
            "has_avatar": user_has_stored_avatar(user),
            "phone_verified": user.phone_verified_at is not None,
            "email_verified": user.email_verified_at is not None,
            "two_factor_enabled": bool(user.two_factor_enabled),
            "two_factor_confirmed_at": user.two_factor_confirmed_at,
            **security_onboarding_fields(user),
            "organization_uuid": organization_uuid,
            "active_workspace_uuid": active_workspace_uuid,
            "dashboard_mode": dashboard_mode,
            "is_superuser": is_superuser,
            **rbac,
        }
    )
