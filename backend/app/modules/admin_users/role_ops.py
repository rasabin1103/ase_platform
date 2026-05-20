"""Platform role assignment via organization membership (MVP: one primary role per user)."""

from __future__ import annotations

import re
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.enums import MembershipStatus, OrganizationStatus, OrganizationType
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User

MVP_PLATFORM_SLUG = "ase-platform"


def _slugify(email: str) -> str:
    local = email.split("@", 1)[0].lower()
    slug = re.sub(r"[^a-z0-9]+", "-", local).strip("-")
    return f"personal-{slug or 'user'}"[:80]


def get_role_codes_for_user(db: Session, user_id: int) -> list[str]:
    stmt = (
        select(Role.code)
        .join(MemberRole, MemberRole.role_id == Role.id)
        .join(OrganizationMember, OrganizationMember.id == MemberRole.organization_member_id)
        .where(OrganizationMember.user_id == user_id)
        .distinct()
        .order_by(Role.code.asc())
    )
    return list(db.execute(stmt).scalars().all())


def resolve_primary_platform_role(role_codes: list[str]) -> str | None:
    for code in ("super_admin", "independent_user", "org_owner", "org_admin", "org_member", "creator_user"):
        if code in role_codes:
            return code
    return role_codes[0] if role_codes else None


def _get_role(db: Session, role_code: str) -> Role | None:
    return db.execute(select(Role).where(Role.code == role_code)).scalar_one_or_none()


def _get_or_create_org(
    db: Session,
    *,
    name: str,
    slug: str,
    org_type: OrganizationType,
    owner: User,
) -> Organization:
    org = db.execute(select(Organization).where(Organization.slug == slug)).scalar_one_or_none()
    if org is None:
        org = Organization(
            name=name,
            slug=slug,
            type=org_type,
            owner_user_id=owner.id,
            status=OrganizationStatus.active,
        )
        db.add(org)
        db.flush()
    else:
        org.owner_user_id = owner.id
        org.status = OrganizationStatus.active
        db.flush()
    return org


def _ensure_membership(
    db: Session,
    *,
    org: Organization,
    user: User,
    role_code: str,
    assigner_id: int,
) -> OrganizationMember:
    member = db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org.id,
            OrganizationMember.user_id == user.id,
        )
    ).scalar_one_or_none()
    if member is None:
        member = OrganizationMember(
            organization_id=org.id,
            user_id=user.id,
            membership_status=MembershipStatus.active,
            joined_at=datetime.now(timezone.utc),
        )
        db.add(member)
        db.flush()
    else:
        member.membership_status = MembershipStatus.active

    role = _get_role(db, role_code)
    if role is None:
        raise ValueError(f"unknown_role:{role_code}")

    db.execute(
        delete(MemberRole).where(MemberRole.organization_member_id == member.id)
    )
    db.add(
        MemberRole(
            organization_member_id=member.id,
            role_id=role.id,
            assigned_by_user_id=assigner_id,
        )
    )
    db.flush()
    return member


def clear_platform_roles(db: Session, user_id: int) -> None:
    """Remove all member_roles for this user (MVP role change / delete prep)."""
    member_ids = list(
        db.execute(
            select(OrganizationMember.id).where(OrganizationMember.user_id == user_id)
        ).scalars().all()
    )
    if not member_ids:
        return
    db.execute(delete(MemberRole).where(MemberRole.organization_member_id.in_(member_ids)))


def assign_platform_role(
    db: Session,
    *,
    user: User,
    role_code: str,
    assigner_id: int,
) -> None:
    """Assign a single MVP platform role (replaces other role assignments on memberships)."""
    clear_platform_roles(db, user.id)

    if role_code == "super_admin":
        platform = _get_or_create_org(
            db,
            name="ASE Platform",
            slug=MVP_PLATFORM_SLUG,
            org_type=OrganizationType.enterprise,
            owner=user,
        )
        _ensure_membership(db, org=platform, user=user, role_code=role_code, assigner_id=assigner_id)
        return

    if role_code == "independent_user":
        personal = _get_or_create_org(
            db,
            name="Personal Workspace",
            slug=_slugify(user.email),
            org_type=OrganizationType.individual,
            owner=user,
        )
        _ensure_membership(db, org=personal, user=user, role_code=role_code, assigner_id=assigner_id)
        return

    raise ValueError(f"unsupported_role:{role_code}")


def count_users_with_role(db: Session, role_code: str) -> int:
    stmt = (
        select(OrganizationMember.user_id)
        .join(MemberRole, MemberRole.organization_member_id == OrganizationMember.id)
        .join(Role, Role.id == MemberRole.role_id)
        .where(Role.code == role_code)
        .distinct()
    )
    return len(list(db.execute(stmt).scalars().all()))
