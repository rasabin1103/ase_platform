"""
Validate the local role-matrix seed.

Usage from repository root:
  python scripts/check_role_matrix_consistency.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPO_ROOT / "ase_backend"
SCRIPTS_ROOT = REPO_ROOT / "scripts"

os.chdir(BACKEND_ROOT)
for path in (BACKEND_ROOT, SCRIPTS_ROOT):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from sqlalchemy import func, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

import app.models  # noqa: E402, F401
from app.core.database import SessionLocal  # noqa: E402
from app.models.audit_log import AuditLog  # noqa: E402
from app.models.enums import InvitationStatus, MembershipStatus, UserStatus  # noqa: E402
from app.models.invitation import Invitation  # noqa: E402
from app.models.member_role import MemberRole  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.organization_member import OrganizationMember  # noqa: E402
from app.models.permission import Permission  # noqa: E402
from app.models.plan import Plan  # noqa: E402
from app.models.product import Product  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.role_permission import RolePermission  # noqa: E402
from app.models.subscription import Subscription  # noqa: E402
from app.models.user import User  # noqa: E402
from app.modules.auth.security import verify_password  # noqa: E402
from reset_and_seed_role_matrix import (  # noqa: E402
    AUDIT_EVENTS,
    MEMBERSHIP_SPECS,
    ORGANIZATION_SPECS,
    PASSWORD,
    PERMISSION_CODES,
    PLAN_SPECS,
    PRODUCT_SPECS,
    ROLE_PERMISSIONS,
    ROLE_SPECS,
    SUBSCRIPTION_SPECS,
    USERS,
)


def ok(condition: bool, message: str, failures: list[str]) -> bool:
    if not condition:
        failures.append(message)
        return False
    return True


def get_role_permissions(db: Session, role_code: str) -> set[str]:
    stmt = (
        select(Permission.code)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(Role, Role.id == RolePermission.role_id)
        .where(Role.code == role_code)
    )
    return set(db.execute(stmt).scalars().all())


def member_roles(db: Session, member_id: int) -> list[str]:
    stmt = (
        select(Role.code)
        .join(MemberRole, MemberRole.role_id == Role.id)
        .where(MemberRole.organization_member_id == member_id)
        .order_by(Role.code)
    )
    return list(db.execute(stmt).scalars().all())


def memberships_for_user(db: Session, user_id: int) -> list[OrganizationMember]:
    return list(db.execute(select(OrganizationMember).where(OrganizationMember.user_id == user_id)).scalars().all())


def build_user_rows(db: Session, failures: list[str]) -> list[tuple[str, str, str, str, str, str]]:
    expected_access = {spec.email: spec.expected_access for spec in USERS}
    rows: list[tuple[str, str, str, str, str, str]] = []

    for spec in USERS:
        user = db.execute(select(User).where(User.email == spec.email)).scalar_one_or_none()
        if user is None:
            rows.append((spec.email, "missing", "missing", "missing", expected_access[spec.email], "FAIL"))
            continue

        user_failures_before = len(failures)
        user_memberships = memberships_for_user(db, user.id)
        if spec.email == "rasabin06@gmail.com":
            ok(len(user_memberships) == 0, "rasabin06@gmail.com should not have organization memberships", failures)
            rows.append((spec.email, "none", "none", "none", expected_access[spec.email], "OK" if len(failures) == user_failures_before else "FAIL"))
            continue

        if not user_memberships:
            ok(False, f"{spec.email} should have at least one organization membership", failures)
            rows.append((spec.email, "none", "none", "none", expected_access[spec.email], "FAIL"))
            continue

        for member in user_memberships:
            org = db.execute(select(Organization).where(Organization.id == member.organization_id)).scalar_one()
            roles = member_roles(db, member.id)
            ok(bool(roles), f"{spec.email} membership in {org.slug} has no role", failures)
            rows.append(
                (
                    spec.email,
                    ", ".join(roles) or "none",
                    org.name,
                    member.membership_status.value,
                    expected_access[spec.email],
                    "OK" if len(failures) == user_failures_before else "FAIL",
                )
            )

    return rows


def validate(db: Session) -> tuple[list[str], list[tuple[str, str, str, str, str, str]]]:
    failures: list[str] = []

    users_by_email = {
        user.email: user
        for user in db.execute(select(User).where(User.email.in_([spec.email for spec in USERS]))).scalars().all()
    }

    for spec in USERS:
        user = users_by_email.get(spec.email)
        ok(user is not None, f"Missing user {spec.email}", failures)
        if user is not None:
            ok(bool(user.password_hash), f"{spec.email} has no password_hash", failures)
            ok(verify_password(PASSWORD, user.password_hash), f"{spec.email} password hash does not verify", failures)

    for code in ROLE_SPECS:
        ok(db.execute(select(Role.id).where(Role.code == code)).scalar_one_or_none() is not None, f"Missing role {code}", failures)

    for code in PERMISSION_CODES:
        ok(
            db.execute(select(Permission.id).where(Permission.code == code)).scalar_one_or_none() is not None,
            f"Missing permission {code}",
            failures,
        )

    super_permissions = get_role_permissions(db, "super_admin")
    ok(super_permissions == set(PERMISSION_CODES), "super_admin does not have exactly all permissions", failures)

    org_owner_permissions = get_role_permissions(db, "org_owner")
    ok({"organizations.read", "organizations.write", "users.read", "users.write"}.issubset(org_owner_permissions), "org_owner is missing organization management permissions", failures)

    viewer_permissions = get_role_permissions(db, "viewer")
    ok(not any(code.endswith(".write") or code.endswith(".manage") for code in viewer_permissions), "viewer has write/manage permissions", failures)

    no_org_user = users_by_email.get("rasabin06@gmail.com")
    if no_org_user is not None:
        count = db.execute(select(func.count()).select_from(OrganizationMember).where(OrganizationMember.user_id == no_org_user.id)).scalar_one()
        ok(int(count) == 0, "User without organization has organization_members rows", failures)

    invited_user = users_by_email.get("rasabin07@gmail.com")
    if invited_user is not None:
        invited_statuses = {m.membership_status for m in memberships_for_user(db, invited_user.id)}
        ok(MembershipStatus.invited in invited_statuses, "Invited user does not have invited membership_status", failures)

    suspended_user = users_by_email.get("rasabin08@gmail.com")
    if suspended_user is not None:
        ok(suspended_user.status == UserStatus.suspended, "Suspended user status is not suspended", failures)

    multi_user = users_by_email.get("rasabin10@gmail.com")
    if multi_user is not None:
        ok(len(memberships_for_user(db, multi_user.id)) == 2, "Multi-tenant user does not have two organization_members", failures)

    for member in db.execute(select(OrganizationMember)).scalars().all():
        ok(bool(member_roles(db, member.id)), f"OrganizationMember id={member.id} has no role", failures)

    for _, slug, _, _, _ in ORGANIZATION_SPECS:
        ok(db.execute(select(Organization.id).where(Organization.slug == slug)).scalar_one_or_none() is not None, f"Missing organization {slug}", failures)

    for code, *_ in PLAN_SPECS:
        ok(db.execute(select(Plan.id).where(Plan.code == code)).scalar_one_or_none() is not None, f"Missing plan {code}", failures)

    for code, *_ in PRODUCT_SPECS:
        ok(db.execute(select(Product.id).where(Product.code == code)).scalar_one_or_none() is not None, f"Missing product {code}", failures)

    for org_slug, plan_code in SUBSCRIPTION_SPECS:
        stmt = (
            select(Subscription.id)
            .join(Organization, Organization.id == Subscription.organization_id)
            .join(Plan, Plan.id == Subscription.plan_id)
            .where(Organization.slug == org_slug, Plan.code == plan_code)
        )
        ok(db.execute(stmt).scalar_one_or_none() is not None, f"Missing subscription {org_slug} -> {plan_code}", failures)

    invite_stmt = (
        select(Invitation.id)
        .join(Organization, Organization.id == Invitation.organization_id)
        .where(
            Invitation.email == "rasabin07@gmail.com",
            Organization.slug == "globex-solutions",
            Invitation.status == InvitationStatus.pending,
        )
    )
    ok(db.execute(invite_stmt).scalar_one_or_none() is not None, "Missing pending invitation for rasabin07@gmail.com", failures)

    for key, *_ in AUDIT_EVENTS:
        ok(db.execute(select(AuditLog.id).where(AuditLog.entity_id == key)).scalar_one_or_none() is not None, f"Missing audit log {key}", failures)

    for email, org_slug, status, role_code in MEMBERSHIP_SPECS:
        stmt = (
            select(OrganizationMember)
            .join(User, User.id == OrganizationMember.user_id)
            .join(Organization, Organization.id == OrganizationMember.organization_id)
            .where(User.email == email, Organization.slug == org_slug)
        )
        member = db.execute(stmt).scalar_one_or_none()
        ok(member is not None, f"Missing membership {email} -> {org_slug}", failures)
        if member is not None:
            ok(member.membership_status == status, f"Unexpected membership_status for {email} -> {org_slug}", failures)
            ok(role_code in member_roles(db, member.id), f"Missing role {role_code} for {email} -> {org_slug}", failures)

    rows = build_user_rows(db, failures)
    return failures, rows


def print_rows(rows: list[tuple[str, str, str, str, str, str]]) -> None:
    print("\nRole matrix consistency")
    print("-" * 158)
    print(f"{'email':<24} {'role':<18} {'organization':<28} {'membership':<12} {'status':<6} expected_access")
    print("-" * 158)
    for email, role, org, membership, expected_access, status in rows:
        print(f"{email:<24} {role:<18} {org:<28} {membership:<12} {status:<6} {expected_access}")


def main() -> None:
    db = SessionLocal()
    try:
        failures, rows = validate(db)
        print_rows(rows)
        if failures:
            print("\nFAIL")
            for failure in failures:
                print(f"  - {failure}")
            raise SystemExit(1)
        print("\nOK: role matrix seed is consistent.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
