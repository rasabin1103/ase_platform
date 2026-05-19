"""
Idempotent demo seed for enterprise RBAC: organizations, role users, requests, assignments.

Run after seed_initial_data.py. Does not delete existing rows.
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.access_request import AccessRequest
from app.models.enums import (
    AccessRequestPriority,
    AccessRequestStatus,
    AccessRequestType,
    MembershipStatus,
    OrganizationStatus,
    OrganizationType,
    ResourceAssignmentStatus,
    UserStatus,
)
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.resource_assignment import ResourceAssignment
from app.models.role import Role
from app.models.user import User
from app.modules.auth.security import hash_password

DEMO_PASSWORD = os.environ.get("DEMO_SEED_PASSWORD", "ChangeMeDemo123!")

DEMO_USERS: tuple[tuple[str, str], ...] = (
    ("rasabin01@gmail.com", "super_admin"),
    ("rasabin02@gmail.com", "org_owner"),
    ("rasabin03@gmail.com", "org_admin"),
    ("rasabin04@gmail.com", "member"),
    ("rasabin05@gmail.com", "independent_user"),
    ("rasabin06@gmail.com", "content_creator"),
)

DEMO_ORG_SLUG = "demo-enterprise-acme"
DEMO_PERSONAL_SLUG = "personal-rasabin05"
DEMO_CREATOR_SLUG = "personal-rasabin06"
MVP_PLATFORM_SLUG = "ase-platform"
MVP_DEMO_USERS: tuple[tuple[str, str], ...] = (
    ("rasabin01@gmail.com", "super_admin"),
    ("rasabin05@gmail.com", "independent_user"),
)


@dataclass(frozen=True)
class SeedRbacResult:
    created_users: int = 0
    created_orgs: int = 0
    created_memberships: int = 0
    created_role_assignments: int = 0
    created_requests: int = 0
    created_assignments: int = 0


def _upsert_user(db: Session, email: str, *, display_name: str) -> tuple[User, bool]:
    user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if user is None:
        user = User(
            email=email,
            password_hash=hash_password(DEMO_PASSWORD),
            display_name=display_name,
            first_name=display_name.split()[0],
            last_name=display_name.split()[-1] if " " in display_name else None,
            status=UserStatus.active,
        )
        db.add(user)
        db.flush()
        return user, True
    user.password_hash = hash_password(DEMO_PASSWORD)
    user.status = UserStatus.active
    db.flush()
    return user, False


def _upsert_org(
    db: Session,
    *,
    name: str,
    slug: str,
    org_type: OrganizationType,
    owner: User,
) -> tuple[Organization, bool]:
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
        return org, True
    org.owner_user_id = owner.id
    org.status = OrganizationStatus.active
    db.flush()
    return org, False


def _ensure_membership(
    db: Session,
    *,
    org: Organization,
    user: User,
    role_code: str,
    assigner_id: int,
) -> tuple[OrganizationMember, bool, bool]:
    created_member = False
    created_role = False
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
        created_member = True
    else:
        member.membership_status = MembershipStatus.active

    role = db.execute(select(Role).where(Role.code == role_code)).scalar_one_or_none()
    if role is None:
        raise RuntimeError(f"Role {role_code!r} missing — run seed_initial_data.py first")

    has_role = (
        db.execute(
            select(MemberRole.id).where(
                MemberRole.organization_member_id == member.id,
                MemberRole.role_id == role.id,
            )
        ).scalar_one_or_none()
        is not None
    )
    if not has_role:
        db.add(
            MemberRole(
                organization_member_id=member.id,
                role_id=role.id,
                assigned_by_user_id=assigner_id,
            )
        )
        db.flush()
        created_role = True
    return member, created_member, created_role


def _seed_mvp_users(db: Session) -> SeedRbacResult:
    created_users = 0
    created_orgs = 0
    created_memberships = 0
    created_role_assignments = 0
    created_requests = 0

    users_by_email: dict[str, User] = {}
    for email, role_code in MVP_DEMO_USERS:
        display = "Roberto Super Admin" if role_code == "super_admin" else "Roberto Independiente"
        user, is_new = _upsert_user(db, email, display_name=display)
        users_by_email[email] = user
        if is_new:
            created_users += 1

    super_admin = users_by_email["rasabin01@gmail.com"]
    independent = users_by_email["rasabin05@gmail.com"]

    platform_org, platform_new = _upsert_org(
        db,
        name="ASE Platform",
        slug=MVP_PLATFORM_SLUG,
        org_type=OrganizationType.enterprise,
        owner=super_admin,
    )
    if platform_new:
        created_orgs += 1

    personal_org, personal_new = _upsert_org(
        db,
        name="Personal Workspace",
        slug=DEMO_PERSONAL_SLUG,
        org_type=OrganizationType.individual,
        owner=independent,
    )
    if personal_new:
        created_orgs += 1

    for user, org, role_code in (
        (super_admin, platform_org, "super_admin"),
        (independent, personal_org, "independent_user"),
    ):
        _, m_created, r_created = _ensure_membership(
            db, org=org, user=user, role_code=role_code, assigner_id=super_admin.id
        )
        if m_created:
            created_memberships += 1
        if r_created:
            created_role_assignments += 1

    existing_req = db.execute(
        select(AccessRequest.id).where(
            AccessRequest.request_type == AccessRequestType.product_access,
            AccessRequest.requested_by_user_id == independent.id,
        )
    ).scalar_one_or_none()
    if existing_req is None:
        db.add(
            AccessRequest(
                organization_id=personal_org.id,
                requested_by_user_id=independent.id,
                request_type=AccessRequestType.product_access,
                target_entity_type="catalog_item",
                target_entity_id="ase-qa-platform-saas",
                title="Acceso a ASE QA Platform",
                description="Demo: solicitud de acceso a producto del catálogo.",
                status=AccessRequestStatus.pending,
                priority=AccessRequestPriority.normal,
            )
        )
        created_requests = 1

    db.commit()
    return SeedRbacResult(
        created_users=created_users,
        created_orgs=created_orgs,
        created_memberships=created_memberships,
        created_role_assignments=created_role_assignments,
        created_requests=created_requests,
        created_assignments=0,
    )


def seed_demo_rbac_db(db: Session) -> SeedRbacResult:
    if settings.MVP_MODE:
        return _seed_mvp_users(db)

    created_users = 0
    created_orgs = 0
    created_memberships = 0
    created_role_assignments = 0
    created_requests = 0
    created_assignments = 0

    users_by_email: dict[str, User] = {}
    for email, role_code in DEMO_USERS:
        display = role_code.replace("_", " ").title()
        user, is_new = _upsert_user(db, email, display_name=display)
        users_by_email[email] = user
        if is_new:
            created_users += 1

    super_admin = users_by_email["rasabin01@gmail.com"]
    org_owner = users_by_email["rasabin02@gmail.com"]
    org_admin = users_by_email["rasabin03@gmail.com"]
    member = users_by_email["rasabin04@gmail.com"]
    independent = users_by_email["rasabin05@gmail.com"]
    content_creator = users_by_email["rasabin06@gmail.com"]

    enterprise_org, org_new = _upsert_org(
        db,
        name="Acme Demo Enterprise",
        slug=DEMO_ORG_SLUG,
        org_type=OrganizationType.business,
        owner=org_owner,
    )
    if org_new:
        created_orgs += 1

    personal_org, personal_new = _upsert_org(
        db,
        name="Personal Workspace",
        slug=DEMO_PERSONAL_SLUG,
        org_type=OrganizationType.individual,
        owner=independent,
    )
    if personal_new:
        created_orgs += 1

    creator_org, creator_org_new = _upsert_org(
        db,
        name="Creator Workspace",
        slug=DEMO_CREATOR_SLUG,
        org_type=OrganizationType.individual,
        owner=content_creator,
    )
    if creator_org_new:
        created_orgs += 1

    role_assignments = (
        (super_admin, enterprise_org, "super_admin", super_admin.id),
        (org_owner, enterprise_org, "org_owner", super_admin.id),
        (org_admin, enterprise_org, "org_admin", org_owner.id),
        (member, enterprise_org, "member", org_owner.id),
        (independent, personal_org, "independent_user", independent.id),
        (content_creator, creator_org, "independent_user", content_creator.id),
        (content_creator, creator_org, "content_creator", super_admin.id),
    )
    for user, org, role_code, assigner_id in role_assignments:
        _, m_created, r_created = _ensure_membership(
            db, org=org, user=user, role_code=role_code, assigner_id=assigner_id
        )
        if m_created:
            created_memberships += 1
        if r_created:
            created_role_assignments += 1

    existing_creator_req = db.execute(
        select(AccessRequest.id).where(
            AccessRequest.request_type == AccessRequestType.creator_application,
            AccessRequest.requested_by_user_id == independent.id,
        )
    ).scalar_one_or_none()
    if existing_creator_req is None:
        db.add(
            AccessRequest(
                organization_id=personal_org.id,
                requested_by_user_id=independent.id,
                request_type=AccessRequestType.creator_application,
                target_entity_type="creator_program",
                target_entity_id="both",
                title="Creator application — courses and products",
                description="Demo: solicitud para ser creador de cursos y productos ASE.",
                status=AccessRequestStatus.pending,
                priority=AccessRequestPriority.normal,
                metadata_json={
                    "creator_scope": "both",
                    "experience": "5 años en QA automation y formación técnica.",
                    "knowledge_areas": "Playwright, CI/CD, testing strategies",
                    "portfolio_url": "https://example.com/portfolio",
                    "motivation": "Quiero publicar frameworks y cursos de calidad en ASE.",
                    "initial_proposal": "Serie introductoria de automatización + plantillas QA.",
                    "quality_agreement": True,
                    "demo": True,
                },
            )
        )
        db.flush()
        created_requests += 1

    existing_request = db.execute(
        select(AccessRequest.id).where(
            AccessRequest.title == "Demo: acceso a QA Frameworks",
            AccessRequest.requested_by_user_id == member.id,
        )
    ).scalar_one_or_none()
    if existing_request is None:
        db.add(
            AccessRequest(
                organization_id=enterprise_org.id,
                requested_by_user_id=member.id,
                request_type=AccessRequestType.product_access,
                target_entity_type="product",
                target_entity_id="qa_frameworks",
                title="Demo: acceso a QA Frameworks",
                description="Solicitud de demo para validar flujo member → org_owner.",
                status=AccessRequestStatus.pending,
                priority=AccessRequestPriority.normal,
                metadata_json={"demo": True},
            )
        )
        db.flush()
        created_requests += 1

    existing_assignment = db.execute(
        select(ResourceAssignment.id).where(
            ResourceAssignment.organization_id == enterprise_org.id,
            ResourceAssignment.resource_type == "product",
            ResourceAssignment.resource_id == "training_portal",
            ResourceAssignment.assigned_to_user_id == member.id,
        )
    ).scalar_one_or_none()
    if existing_assignment is None:
        db.add(
            ResourceAssignment(
                organization_id=enterprise_org.id,
                resource_type="product",
                resource_id="training_portal",
                assigned_to_user_id=member.id,
                assigned_by_user_id=org_admin.id,
                status=ResourceAssignmentStatus.active,
            )
        )
        db.flush()
        created_assignments += 1

    return SeedRbacResult(
        created_users=created_users,
        created_orgs=created_orgs,
        created_memberships=created_memberships,
        created_role_assignments=created_role_assignments,
        created_requests=created_requests,
        created_assignments=created_assignments,
    )


def seed_demo_rbac() -> SeedRbacResult:
    db = SessionLocal()
    try:
        result = seed_demo_rbac_db(db)
        db.commit()
        return result
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    result = seed_demo_rbac()
    print("RBAC demo seed completed")
    print(
        f"created_users={result.created_users} "
        f"created_orgs={result.created_orgs} "
        f"created_memberships={result.created_memberships} "
        f"created_role_assignments={result.created_role_assignments} "
        f"created_requests={result.created_requests} "
        f"created_assignments={result.created_assignments}"
    )


if __name__ == "__main__":
    main()
