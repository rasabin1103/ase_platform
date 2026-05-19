"""Creator application workflow constants and helpers."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import AccessRequestType, MembershipStatus, OrganizationType
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role

CREATOR_APPROVAL_REQUIRED_MSG = (
    "You need creator approval before creating courses or products."
)

CREATOR_REQUEST_TYPES: frozenset[AccessRequestType] = frozenset(
    {
        AccessRequestType.creator_access,
        AccessRequestType.creator_application,
        AccessRequestType.product_creator_application,
        AccessRequestType.course_creator_application,
    }
)

CREATOR_REQUEST_TYPE_VALUES: frozenset[str] = frozenset(t.value for t in CREATOR_REQUEST_TYPES)

CONTENT_CREATOR_ROLE = "content_creator"


def is_creator_request_type(request_type: AccessRequestType | str) -> bool:
    value = request_type.value if isinstance(request_type, AccessRequestType) else request_type
    return value in CREATOR_REQUEST_TYPE_VALUES


def get_personal_workspace_member(db: Session, *, user_id: int) -> OrganizationMember | None:
    """Active membership on an individual (personal) organization."""
    stmt = (
        select(OrganizationMember)
        .join(Organization, Organization.id == OrganizationMember.organization_id)
        .where(
            OrganizationMember.user_id == user_id,
            OrganizationMember.membership_status == MembershipStatus.active,
            Organization.type == OrganizationType.individual,
        )
        .order_by(OrganizationMember.id.asc())
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()


def assign_content_creator_role(
    db: Session,
    *,
    user_id: int,
    assigned_by_user_id: int,
) -> MemberRole:
    member = get_personal_workspace_member(db, user_id=user_id)
    if member is None:
        raise ValueError("User has no personal workspace membership")

    role = db.execute(select(Role).where(Role.code == CONTENT_CREATOR_ROLE)).scalar_one_or_none()
    if role is None:
        raise ValueError(f"Role {CONTENT_CREATOR_ROLE!r} is not seeded")

    existing = db.execute(
        select(MemberRole).where(
            MemberRole.organization_member_id == member.id,
            MemberRole.role_id == role.id,
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    assignment = MemberRole(
        organization_member_id=member.id,
        role_id=role.id,
        assigned_by_user_id=assigned_by_user_id,
    )
    db.add(assignment)
    db.flush()
    return assignment
