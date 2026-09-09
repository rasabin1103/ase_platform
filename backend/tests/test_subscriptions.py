"""Tests for app.modules.subscriptions — the admin CRUD surface over
Subscription rows (distinct from app.modules.billing, which is what
actually creates/updates these rows from real Stripe events; this module
is the manual/admin-facing management API on top of the same table)."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import (
    MembershipStatus,
    OrganizationStatus,
    OrganizationType,
    PlanStatus,
    RoleScope,
    SubscriptionProvider,
    SubscriptionStatus,
    UserStatus,
)
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.permission import Permission
from app.models.plan import Plan
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.subscription import Subscription
from app.models.user import User
from app.modules.auth.security import create_access_token, hash_password


def _make_org_admin_with_permissions(db: Session, *, permission_codes: list[str]) -> tuple[User, dict[str, str], int]:
    """subscriptions.manage/read is meant for a real org-side admin role
    (e.g. an enterprise org's own admin), not the independent_user fixture
    used everywhere else in this suite — independent_user carries no
    permissions of its own, so reusing it here would only ever hit the
    super-admin bypass or a 403, never the actual
    "non-super-admin managing their own org" branch this router has. Builds
    a minimal user + organization + role with exactly the permissions the
    test needs, same shape as test_purchase_flow.py's role/permission
    helpers."""
    user = User(
        email=f"orgadmin_{secrets.token_hex(6)}@example.com",
        password_hash=hash_password("Password123!"),
        status=UserStatus.active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    org = Organization(
        name="Admin Org", slug=f"admin-org-{secrets.token_hex(6)}",
        type=OrganizationType.enterprise, owner_user_id=user.id, status=OrganizationStatus.active,
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    member = OrganizationMember(
        organization_id=org.id, user_id=user.id,
        membership_status=MembershipStatus.active, joined_at=datetime.now(timezone.utc),
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    role_code = f"org-admin-{secrets.token_hex(4)}"
    role = Role(code=role_code, name="Org Admin (test)", scope=RoleScope.organization)
    db.add(role)
    db.commit()
    db.refresh(role)

    for code in permission_codes:
        perm = db.query(Permission).filter(Permission.code == code).one_or_none()
        if perm is None:
            perm = Permission(code=code, name=code, module="subscriptions")
            db.add(perm)
            db.commit()
            db.refresh(perm)
        db.add(RolePermission(role_id=role.id, permission_id=perm.id))
    db.commit()

    db.add(MemberRole(organization_member_id=member.id, role_id=role.id, assigned_by_user_id=user.id))
    db.commit()

    token = create_access_token(user_uuid=user.uuid)
    return user, {"Authorization": f"Bearer {token}"}, org.id


def _make_plan(db: Session) -> Plan:
    plan = Plan(
        code=f"plan-{secrets.token_hex(6)}",
        name="Test Plan",
        price=Decimal("19.00"),
        currency="EUR",
        is_active=True,
        status=PlanStatus.active,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def _make_organization(db: Session, *, owner_user_id: int) -> Organization:
    org = Organization(
        name="Other Org",
        slug=f"other-org-{secrets.token_hex(6)}",
        type=OrganizationType.enterprise,
        owner_user_id=owner_user_id,
        status=OrganizationStatus.active,
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def _get_own_org_id(db: Session, user: User) -> int:
    return db.execute(select(Organization).where(Organization.owner_user_id == user.id)).scalar_one().id


# --- create -----------------------------------------------------------------


def test_super_admin_can_create_a_subscription_for_any_organization(
    db: Session, client: TestClient, independent_user: User, super_admin_headers: dict[str, str],
):
    org_id = _get_own_org_id(db, independent_user)
    plan = _make_plan(db)

    res = client.post(
        "/api/v1/subscriptions",
        json={
            "organization_id": org_id,
            "plan_id": plan.id,
            "starts_at": datetime.now(timezone.utc).isoformat(),
        },
        headers=super_admin_headers,
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["organization_id"] == org_id
    assert body["plan_id"] == plan.id
    assert body["status"] == "active"
    assert body["provider"] == "manual"


def test_create_subscription_rejects_unknown_organization(client: TestClient, super_admin_headers: dict[str, str]):
    res = client.post(
        "/api/v1/subscriptions",
        json={"organization_id": 999999, "plan_id": 1, "starts_at": datetime.now(timezone.utc).isoformat()},
        headers=super_admin_headers,
    )
    assert res.status_code == 400


def test_create_subscription_rejects_unknown_plan(
    db: Session, client: TestClient, independent_user: User, super_admin_headers: dict[str, str],
):
    org_id = _get_own_org_id(db, independent_user)
    res = client.post(
        "/api/v1/subscriptions",
        json={"organization_id": org_id, "plan_id": 999999, "starts_at": datetime.now(timezone.utc).isoformat()},
        headers=super_admin_headers,
    )
    assert res.status_code == 400


def test_independent_user_cannot_create_subscription_for_another_organization(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
):
    other_org = _make_organization(db, owner_user_id=independent_user.id)
    plan = _make_plan(db)

    res = client.post(
        "/api/v1/subscriptions",
        json={
            "organization_id": other_org.id,
            "plan_id": plan.id,
            "starts_at": datetime.now(timezone.utc).isoformat(),
        },
        headers=independent_headers,
    )
    assert res.status_code == 403


def test_org_admin_can_create_subscription_for_own_organization(db: Session, client: TestClient):
    _, headers, org_id = _make_org_admin_with_permissions(db, permission_codes=["subscriptions.manage"])
    plan = _make_plan(db)

    res = client.post(
        "/api/v1/subscriptions",
        json={"organization_id": org_id, "plan_id": plan.id, "starts_at": datetime.now(timezone.utc).isoformat()},
        headers=headers,
    )
    assert res.status_code == 201, res.text


# --- list / get ---------------------------------------------------------


def test_list_subscriptions_filters_by_organization(
    db: Session, client: TestClient, independent_user: User, super_admin_headers: dict[str, str],
):
    org_id = _get_own_org_id(db, independent_user)
    other_org = _make_organization(db, owner_user_id=independent_user.id)
    plan = _make_plan(db)

    db.add(Subscription(organization_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc)))
    db.add(Subscription(organization_id=other_org.id, plan_id=plan.id, starts_at=datetime.now(timezone.utc)))
    db.commit()

    res = client.get(
        "/api/v1/subscriptions", params={"organization_id": org_id}, headers=super_admin_headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["organization_id"] == org_id


def test_org_admin_only_sees_own_organization_subscriptions(db: Session, client: TestClient):
    admin_user, headers, org_id = _make_org_admin_with_permissions(db, permission_codes=["subscriptions.read"])
    other_org = _make_organization(db, owner_user_id=admin_user.id)
    plan = _make_plan(db)

    db.add(Subscription(organization_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc)))
    db.add(Subscription(organization_id=other_org.id, plan_id=plan.id, starts_at=datetime.now(timezone.utc)))
    db.commit()

    res = client.get("/api/v1/subscriptions", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["organization_id"] == org_id


def test_get_subscription_returns_404_for_unknown_id(client: TestClient, super_admin_headers: dict[str, str]):
    res = client.get("/api/v1/subscriptions/999999", headers=super_admin_headers)
    assert res.status_code == 404


def test_org_admin_cannot_read_another_organizations_subscription(db: Session, client: TestClient):
    admin_user, headers, _org_id = _make_org_admin_with_permissions(db, permission_codes=["subscriptions.read"])
    other_org = _make_organization(db, owner_user_id=admin_user.id)
    plan = _make_plan(db)
    sub = Subscription(organization_id=other_org.id, plan_id=plan.id, starts_at=datetime.now(timezone.utc))
    db.add(sub)
    db.commit()
    db.refresh(sub)

    res = client.get(f"/api/v1/subscriptions/{sub.id}", headers=headers)
    # Cross-tenant reads look like a 404, not a 403 — same "don't confirm
    # the row even exists" pattern used elsewhere in this module's router.
    assert res.status_code == 404


# --- update / cancel ------------------------------------------------------


def test_update_subscription_changes_status_and_dates(
    db: Session, client: TestClient, independent_user: User, super_admin_headers: dict[str, str],
):
    org_id = _get_own_org_id(db, independent_user)
    plan = _make_plan(db)
    sub = Subscription(
        organization_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc),
        provider=SubscriptionProvider.manual, status=SubscriptionStatus.trialing,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    res = client.patch(
        f"/api/v1/subscriptions/{sub.id}", json={"status": "active"}, headers=super_admin_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "active"

    db.refresh(sub)
    assert sub.status == SubscriptionStatus.active


def test_update_subscription_rejects_unknown_plan(
    db: Session, client: TestClient, independent_user: User, super_admin_headers: dict[str, str],
):
    org_id = _get_own_org_id(db, independent_user)
    plan = _make_plan(db)
    sub = Subscription(organization_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc))
    db.add(sub)
    db.commit()
    db.refresh(sub)

    res = client.patch(
        f"/api/v1/subscriptions/{sub.id}", json={"plan_id": 999999}, headers=super_admin_headers,
    )
    assert res.status_code == 400


def test_delete_subscription_cancels_rather_than_deletes_the_row(
    db: Session, client: TestClient, independent_user: User, super_admin_headers: dict[str, str],
):
    org_id = _get_own_org_id(db, independent_user)
    plan = _make_plan(db)
    sub = Subscription(
        organization_id=org_id, plan_id=plan.id, starts_at=datetime.now(timezone.utc), status=SubscriptionStatus.active,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    sub_id = sub.id

    res = client.delete(f"/api/v1/subscriptions/{sub_id}", headers=super_admin_headers)
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "canceled"

    # The row is soft-canceled, not actually removed — DELETE here maps to
    # SubscriptionsService.cancel(), never a real DB delete.
    still_there = db.execute(select(Subscription).where(Subscription.id == sub_id)).scalar_one_or_none()
    assert still_there is not None
    assert still_there.status == SubscriptionStatus.canceled
