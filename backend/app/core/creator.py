"""Creator application workflow constants and helpers."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import AccessRequestType, MembershipStatus, OrganizationStatus, OrganizationType
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User

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


def ensure_personal_workspace(db: Session, *, user_id: int) -> OrganizationMember:
    """Every individual (non-org) user needs exactly one personal
    Organization + membership + `independent_user` role to use anything
    org-scoped — billing (Stripe checkout resolves the customer's workspace
    via this), catalog entitlements, permissions, etc. Registration didn't
    provision one historically (AuthService.register only ever created the
    User row), so this is called both there for new signups and lazily here
    for any pre-existing account that's missing it — idempotent either way,
    safe to call as often as needed."""
    existing = get_personal_workspace_member(db, user_id=user_id)
    if existing is not None:
        return existing

    user = db.get(User, user_id)
    if user is None:
        raise ValueError(f"No user with id={user_id}")

    role = db.execute(select(Role).where(Role.code == "independent_user")).scalar_one_or_none()
    if role is None:
        raise ValueError("Role 'independent_user' is not seeded")

    org = Organization(
        name=user.display_name or user.email,
        # Short, collision-proof, and never derived from user-editable data
        # (email/name changes never orphan the slug).
        slug=f"user-{uuid4().hex[:16]}",
        type=OrganizationType.individual,
        owner_user_id=user.id,
        status=OrganizationStatus.active,
    )
    db.add(org)
    db.flush()

    member = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        membership_status=MembershipStatus.active,
        joined_at=datetime.now(timezone.utc),
    )
    db.add(member)
    db.flush()

    db.add(MemberRole(organization_member_id=member.id, role_id=role.id, assigned_by_user_id=user.id))
    db.flush()

    return member


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
