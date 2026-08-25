"""Unit tests for OrganizationMembersService.leave() — the self-service
"leave this organization" flow (task #306), including the owner-can-leave /
auto-delete-when-alone behavior added afterwards (task #309).

Uses the `db` fixture from conftest.py (truncate-before-each, requires
TEST_DATABASE_URL — the whole module is skipped automatically otherwise).
"""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.enums import MembershipStatus, OrganizationStatus, OrganizationType, RoleScope, UserStatus
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User
from app.modules.auth.security import hash_password
from app.modules.organization_members.service import OrganizationMembersService
from tests.conftest import make_user_with_role


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
) -> Organization:
    org = Organization(
        name=f"Org {secrets.token_hex(4)}",
        slug=f"org-{secrets.token_hex(6)}",
        type=org_type,
        owner_user_id=owner.id,
        status=status,
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def _add_member(
    db: Session,
    *,
    org: Organization,
    user: User,
    membership_status: MembershipStatus = MembershipStatus.active,
) -> OrganizationMember:
    member = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        membership_status=membership_status,
        joined_at=datetime.now(timezone.utc),
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def _ensure_role(db: Session, code: str, *, scope: RoleScope) -> Role:
    role = db.query(Role).filter(Role.code == code).one_or_none()
    if role is None:
        role = Role(code=code, name=code.replace("_", " ").title(), scope=scope, description=None)
        db.add(role)
        db.commit()
        db.refresh(role)
    return role


def _assign_role(db: Session, *, member: OrganizationMember, role: Role) -> None:
    db.add(MemberRole(organization_member_id=member.id, role_id=role.id, assigned_by_user_id=member.user_id))
    db.commit()


def test_leave_raises_404_when_not_a_member(db: Session):
    owner = _make_user(db, email_prefix="owner")
    org = _make_org(db, owner=owner)
    outsider = _make_user(db, email_prefix="outsider")

    svc = OrganizationMembersService(db)
    with pytest.raises(HTTPException) as exc_info:
        svc.leave(organization_id=org.id, user_id=outsider.id)
    assert exc_info.value.status_code == 404


def test_leave_blocked_for_individual_workspace(db: Session):
    owner = _make_user(db, email_prefix="indiv")
    org = _make_org(db, owner=owner, org_type=OrganizationType.individual)
    _add_member(db, org=org, user=owner)

    svc = OrganizationMembersService(db)
    with pytest.raises(HTTPException) as exc_info:
        svc.leave(organization_id=org.id, user_id=owner.id)
    assert exc_info.value.status_code == 400
    assert "individual workspace" in exc_info.value.detail

    # Nothing was touched.
    db.refresh(org)
    assert org.status == OrganizationStatus.active


def test_leave_owner_alone_deletes_the_organization(db: Session):
    """The org's only member is its owner — leaving takes the org with it
    (task #309): the membership disappears and the organization itself is
    soft-deleted, exactly like OrganizationsService.soft_delete()."""
    owner = _make_user(db, email_prefix="soleowner")
    org = _make_org(db, owner=owner)
    _add_member(db, org=org, user=owner)

    svc = OrganizationMembersService(db)
    svc.leave(organization_id=org.id, user_id=owner.id)

    db.refresh(org)
    assert org.status == OrganizationStatus.deleted
    assert svc.repo.get_by_org_user(organization_id=org.id, user_id=owner.id) is None


def test_leave_owner_with_other_members_must_transfer_first(db: Session):
    """Multiple active members remain — the org can't be auto-deleted
    (there's a team still using it), so the owner is still blocked until
    they hand off ownership, same as before task #309."""
    owner = _make_user(db, email_prefix="owner2")
    org = _make_org(db, owner=owner)
    _add_member(db, org=org, user=owner)
    teammate = _make_user(db, email_prefix="teammate")
    _add_member(db, org=org, user=teammate)

    svc = OrganizationMembersService(db)
    with pytest.raises(HTTPException) as exc_info:
        svc.leave(organization_id=org.id, user_id=owner.id)
    assert exc_info.value.status_code == 400
    assert "Transfer ownership" in exc_info.value.detail

    db.refresh(org)
    assert org.status == OrganizationStatus.active
    assert svc.repo.get_by_org_user(organization_id=org.id, user_id=owner.id) is not None


def test_leave_normal_member_succeeds_without_touching_the_organization(db: Session):
    owner = _make_user(db, email_prefix="owner3")
    org = _make_org(db, owner=owner)
    _add_member(db, org=org, user=owner)
    member_user = _make_user(db, email_prefix="member3")
    _add_member(db, org=org, user=member_user)

    svc = OrganizationMembersService(db)
    svc.leave(organization_id=org.id, user_id=member_user.id)

    db.refresh(org)
    assert org.status == OrganizationStatus.active
    assert svc.repo.get_by_org_user(organization_id=org.id, user_id=member_user.id) is None
    # The owner's own membership is untouched.
    assert svc.repo.get_by_org_user(organization_id=org.id, user_id=owner.id) is not None


def test_leave_blocked_when_it_would_lock_out_a_super_admin(db: Session):
    """A member holding super_admin through this org, with no other active
    organization, can't leave — mirrors
    OrganizationsService._would_orphan_a_super_admin on the admin side."""
    admin = make_user_with_role(
        db,
        email="lockout_admin@example.test",
        role_code="super_admin",
        org_type=OrganizationType.enterprise,
        role_scope=RoleScope.platform,
    )
    member = OrganizationMembersService(db).repo.get_by_org_user(
        organization_id=db.query(Organization).filter(Organization.owner_user_id == admin.id).one().id,
        user_id=admin.id,
    )
    assert member is not None
    org_id = member.organization_id

    svc = OrganizationMembersService(db)
    with pytest.raises(HTTPException) as exc_info:
        svc.leave(organization_id=org_id, user_id=admin.id)
    assert exc_info.value.status_code == 400
    assert "lock you out" in exc_info.value.detail


def test_leave_super_admin_allowed_with_another_active_organization(db: Session):
    """Same super_admin-holding member as above, but this time they have a
    second active organization elsewhere — the lockout guard should no
    longer apply, and leaving (as a non-owner, non-sole member) succeeds."""
    admin = make_user_with_role(
        db,
        email="safe_admin@example.test",
        role_code="super_admin",
        org_type=OrganizationType.enterprise,
        role_scope=RoleScope.platform,
    )
    home_org = db.query(Organization).filter(Organization.owner_user_id == admin.id).one()

    # A second org where this admin is just a regular (non-owner) member —
    # this is the org they'll leave.
    other_owner = _make_user(db, email_prefix="other_owner")
    other_org = _make_org(db, owner=other_owner)
    _add_member(db, org=other_org, user=other_owner)
    _add_member(db, org=other_org, user=admin)

    svc = OrganizationMembersService(db)
    svc.leave(organization_id=other_org.id, user_id=admin.id)

    assert svc.repo.get_by_org_user(organization_id=other_org.id, user_id=admin.id) is None
    # Their real home org (where super_admin lives) is untouched.
    db.refresh(home_org)
    assert home_org.status == OrganizationStatus.active
