"""Unit tests for build_application_map() (task #304/#309) — the dashboard's
"application map": real organizations (with active members) on one branch,
unaffiliated individual users on the other.

Uses the `db` fixture from conftest.py (requires TEST_DATABASE_URL — the
whole module is skipped automatically otherwise).
"""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.enums import MembershipStatus, OrganizationStatus, OrganizationType, RoleScope, UserStatus
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User
from app.modules.admin_dashboard.analytics import build_application_map
from app.modules.auth.security import hash_password


def _make_user(db: Session, *, email_prefix: str = "user") -> User:
    user = User(
        email=f"{email_prefix}_{secrets.token_hex(6)}@example.com",
        password_hash=hash_password("Password123!"),
        status=UserStatus.active,
        display_name=email_prefix,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _make_org(
    db: Session,
    *,
    owner: User,
    org_type: OrganizationType = OrganizationType.business,
    status: OrganizationStatus = OrganizationStatus.active,
    is_platform_core: bool = False,
) -> Organization:
    org = Organization(
        name=f"Org {secrets.token_hex(4)}",
        slug=f"org-{secrets.token_hex(6)}",
        type=org_type,
        owner_user_id=owner.id,
        status=status,
        is_platform_core=is_platform_core,
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def _add_member(db: Session, *, org: Organization, user: User) -> OrganizationMember:
    member = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        membership_status=MembershipStatus.active,
        joined_at=datetime.now(timezone.utc),
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def _ensure_role(db: Session, code: str) -> Role:
    role = db.query(Role).filter(Role.code == code).one_or_none()
    if role is None:
        role = Role(code=code, name=code.replace("_", " ").title(), scope=RoleScope.organization, description=None)
        db.add(role)
        db.commit()
        db.refresh(role)
    return role


def _assign_role(db: Session, *, member: OrganizationMember, role_code: str) -> None:
    role = _ensure_role(db, role_code)
    db.add(MemberRole(organization_member_id=member.id, role_id=role.id, assigned_by_user_id=member.user_id))
    db.commit()


def test_application_map_lists_real_org_with_members_and_roles(db: Session):
    owner = _make_user(db, email_prefix="owner")
    org = _make_org(db, owner=owner, org_type=OrganizationType.business)
    owner_member = _add_member(db, org=org, user=owner)
    _assign_role(db, member=owner_member, role_code="org_owner")

    teammate = _make_user(db, email_prefix="teammate")
    teammate_member = _add_member(db, org=org, user=teammate)
    _assign_role(db, member=teammate_member, role_code="org_admin")

    result = build_application_map(db)

    matching = [o for o in result["organizations"] if o["uuid"] == str(org.uuid)]
    assert len(matching) == 1
    org_node = matching[0]
    assert org_node["name"] == org.name
    assert org_node["type"] == "business"
    emails = {m["email"] for m in org_node["members"]}
    assert owner.email in emails
    assert teammate.email in emails
    roles_by_email = {m["email"]: m["role_codes"] for m in org_node["members"]}
    assert roles_by_email[owner.email] == ["org_owner"]
    assert roles_by_email[teammate.email] == ["org_admin"]

    # Both members are accounted for under the org — neither should also
    # show up in the individual-users branch.
    individual_emails = {u["email"] for u in result["individual_users"]}
    assert owner.email not in individual_emails
    assert teammate.email not in individual_emails


def test_application_map_buckets_unaffiliated_users_as_individual(db: Session):
    lone_user = _make_user(db, email_prefix="lone")

    # A user whose only membership is their personal `individual`-type
    # workspace should land in the individual-users branch too, not be
    # treated as belonging to a one-person "organization".
    workspace_owner = _make_user(db, email_prefix="workspace")
    workspace = _make_org(db, owner=workspace_owner, org_type=OrganizationType.individual)
    _add_member(db, org=workspace, user=workspace_owner)

    result = build_application_map(db)

    individual_emails = {u["email"] for u in result["individual_users"]}
    assert lone_user.email in individual_emails
    assert workspace_owner.email in individual_emails

    org_uuids = {o["uuid"] for o in result["organizations"]}
    assert str(workspace.uuid) not in org_uuids


def test_application_map_excludes_platform_core_and_deleted_or_suspended_orgs(db: Session):
    core_owner = _make_user(db, email_prefix="core")
    core_org = _make_org(db, owner=core_owner, org_type=OrganizationType.enterprise, is_platform_core=True)
    _add_member(db, org=core_org, user=core_owner)

    deleted_owner = _make_user(db, email_prefix="deletedorg")
    deleted_org = _make_org(
        db, owner=deleted_owner, org_type=OrganizationType.business, status=OrganizationStatus.deleted
    )
    _add_member(db, org=deleted_org, user=deleted_owner)

    suspended_owner = _make_user(db, email_prefix="suspendedorg")
    suspended_org = _make_org(
        db, owner=suspended_owner, org_type=OrganizationType.business, status=OrganizationStatus.suspended
    )
    _add_member(db, org=suspended_org, user=suspended_owner)

    result = build_application_map(db)

    org_uuids = {o["uuid"] for o in result["organizations"]}
    assert str(core_org.uuid) not in org_uuids
    assert str(deleted_org.uuid) not in org_uuids
    assert str(suspended_org.uuid) not in org_uuids

    # Members of excluded orgs still show up somewhere — as individuals,
    # since none of their orgs "count" as a real organization.
    individual_emails = {u["email"] for u in result["individual_users"]}
    assert core_owner.email in individual_emails
    assert deleted_owner.email in individual_emails
    assert suspended_owner.email in individual_emails


def test_application_map_individual_users_truncation(db: Session):
    emails = []
    for _ in range(3):
        u = _make_user(db, email_prefix="many")
        emails.append(u.email)

    result = build_application_map(db, individual_users_limit=2)

    assert result["individual_users_total"] >= 3
    assert len(result["individual_users"]) == 2
    assert result["individual_users_truncated"] is True
