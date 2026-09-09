"""Tests for app.modules.org_catalog — organization-scoped catalog
association and per-member content grants under /api/v1/organizations/me.
super_admin_headers doubles as "the organization admin" here since
require_permission() bypasses all permission codes for a super admin (see
app/modules/auth/dependencies.py) and require_tenant_context() resolves a
super admin's own platform organization the same way any admin's home org
would resolve — so these tests exercise the real authorization logic
(require_tenant_context, the grant-target org-membership filter) without
needing a full non-admin RBAC setup for every scenario."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.enums import (
    CatalogItemLevel,
    CatalogItemStatus,
    CatalogItemType,
    MembershipStatus,
    RoleScope,
    UserStatus,
)
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User


def _make_catalog_item(db: Session, *, item_type: CatalogItemType = CatalogItemType.product) -> CatalogItem:
    item = CatalogItem(
        title="Org Test Item",
        slug=f"org-item-{secrets.token_hex(6)}",
        type=item_type,
        category="testing",
        short_description="Short description",
        long_description="Long description",
        image_url="https://example.com/image.png",
        price=Decimal("29.00"),
        currency="EUR",
        status=CatalogItemStatus.published,
        level=CatalogItemLevel.beginner,
        author="ASE",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def _add_member_to_org(db: Session, *, organization_id: int, email: str, role_code: str = "content_creator") -> User:
    """Adds a brand-new user directly to an EXISTING organization — unlike
    conftest's make_user_with_role(), which always creates a fresh
    organization for the user. org_catalog's grant/stat endpoints operate
    on one organization's actual member list, so the test data has to be
    real fellow members of that same org, not each in their own."""
    user = User(email=email, password_hash="x", display_name=email.split("@")[0], status=UserStatus.active)
    db.add(user)
    db.commit()
    db.refresh(user)

    member = OrganizationMember(
        organization_id=organization_id, user_id=user.id,
        membership_status=MembershipStatus.active, joined_at=datetime.now(timezone.utc),
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    role = db.query(Role).filter(Role.code == role_code).one_or_none()
    if role is None:
        role = Role(code=role_code, name=role_code.replace("_", " ").title(), scope=RoleScope.organization)
        db.add(role)
        db.commit()
        db.refresh(role)
    db.add(MemberRole(organization_member_id=member.id, role_id=role.id, assigned_by_user_id=user.id))
    db.commit()
    return user


def _super_admin_org_id(db: Session, super_admin_user: User) -> int:
    return db.query(Organization).filter(Organization.owner_user_id == super_admin_user.id).one().id


# --- associate / remove -----------------------------------------------------


def test_associate_and_remove_catalog_item(
    db: Session, client: TestClient, super_admin_headers: dict[str, str],
):
    item = _make_catalog_item(db)
    res = client.post(f"/api/v1/organizations/me/catalog-items/{item.slug}", headers=super_admin_headers)
    assert res.status_code == 200, res.text
    assert res.json()["created"] is True

    # Associating the same item again is idempotent, not an error.
    res2 = client.post(f"/api/v1/organizations/me/catalog-items/{item.slug}", headers=super_admin_headers)
    assert res2.status_code == 200
    assert res2.json()["created"] is False

    list_res = client.get("/api/v1/organizations/me/catalog-items", headers=super_admin_headers)
    assert list_res.status_code == 200
    slugs = [i["slug"] for i in list_res.json()["items"]]
    assert item.slug in slugs

    del_res = client.delete(f"/api/v1/organizations/me/catalog-items/{item.slug}", headers=super_admin_headers)
    assert del_res.status_code == 200
    assert del_res.json()["removed"] is True

    list_res2 = client.get("/api/v1/organizations/me/catalog-items", headers=super_admin_headers)
    slugs2 = [i["slug"] for i in list_res2.json()["items"]]
    assert item.slug not in slugs2


def test_removing_an_unassociated_item_reports_removed_false(
    db: Session, client: TestClient, super_admin_headers: dict[str, str],
):
    item = _make_catalog_item(db)
    res = client.delete(f"/api/v1/organizations/me/catalog-items/{item.slug}", headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["removed"] is False


def test_associate_unknown_slug_returns_404(client: TestClient, super_admin_headers: dict[str, str]):
    res = client.post("/api/v1/organizations/me/catalog-items/does-not-exist", headers=super_admin_headers)
    assert res.status_code == 404


def test_independent_user_cannot_associate_catalog_items(
    db: Session, client: TestClient, independent_headers: dict[str, str],
):
    item = _make_catalog_item(db)
    res = client.post(f"/api/v1/organizations/me/catalog-items/{item.slug}", headers=independent_headers)
    assert res.status_code == 403


# --- grant targets / grant --------------------------------------------------


def test_search_grant_targets_excludes_super_admins_and_finds_real_members(
    db: Session, client: TestClient, super_admin_user: User, super_admin_headers: dict[str, str],
):
    org_id = _super_admin_org_id(db, super_admin_user)
    member = _add_member_to_org(db, organization_id=org_id, email="member-a@example.com")

    res = client.get("/api/v1/organizations/me/grant-targets", headers=super_admin_headers)
    assert res.status_code == 200
    emails = [i["email"] for i in res.json()["items"]]
    assert member.email in emails
    assert super_admin_user.email not in emails


def test_grant_product_gives_a_member_access(
    db: Session, client: TestClient, super_admin_user: User, super_admin_headers: dict[str, str],
):
    org_id = _super_admin_org_id(db, super_admin_user)
    member = _add_member_to_org(db, organization_id=org_id, email="member-b@example.com")
    item = _make_catalog_item(db)

    res = client.post(
        "/api/v1/organizations/me/grant",
        json={"catalogItemSlug": item.slug, "userUuid": str(member.uuid)},
        headers=super_admin_headers,
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["granted"] is True
    assert body["alreadyOwned"] is False
    assert body["targetEmail"] == member.email

    # Granting the same item again reports alreadyOwned instead of erroring.
    res2 = client.post(
        "/api/v1/organizations/me/grant",
        json={"catalogItemSlug": item.slug, "userUuid": str(member.uuid)},
        headers=super_admin_headers,
    )
    assert res2.status_code == 200
    assert res2.json()["alreadyOwned"] is True


def test_grant_product_rejects_unknown_target_user(
    db: Session, client: TestClient, super_admin_headers: dict[str, str],
):
    item = _make_catalog_item(db)
    res = client.post(
        "/api/v1/organizations/me/grant",
        json={"catalogItemSlug": item.slug, "userUuid": "00000000-0000-0000-0000-000000000000"},
        headers=super_admin_headers,
    )
    assert res.status_code == 404


def test_independent_user_cannot_grant_products(client: TestClient, independent_headers: dict[str, str]):
    res = client.get("/api/v1/organizations/me/grant-targets", headers=independent_headers)
    assert res.status_code == 403


# --- member stats / analytics ------------------------------------------


def test_member_catalog_stats_reports_sent_and_consumed_items(
    db: Session, client: TestClient, super_admin_user: User, super_admin_headers: dict[str, str],
):
    org_id = _super_admin_org_id(db, super_admin_user)
    member = _add_member_to_org(db, organization_id=org_id, email="member-c@example.com")
    item = _make_catalog_item(db)

    grant_res = client.post(
        "/api/v1/organizations/me/grant",
        json={"catalogItemSlug": item.slug, "userUuid": str(member.uuid)},
        headers=super_admin_headers,
    )
    assert grant_res.status_code == 200

    res = client.get("/api/v1/organizations/me/member-catalog-stats", headers=super_admin_headers)
    assert res.status_code == 200
    items = {i["email"]: i for i in res.json()["items"]}
    assert member.email in items
    assert items[member.email]["sentCount"] == 1
    assert items[member.email]["consumedCount"] == 1


def test_organization_analytics_reflects_associated_catalog_and_roles(
    db: Session, client: TestClient, super_admin_user: User, super_admin_headers: dict[str, str],
):
    org_id = _super_admin_org_id(db, super_admin_user)
    _add_member_to_org(db, organization_id=org_id, email="member-d@example.com", role_code="content_creator")
    item = _make_catalog_item(db)
    assoc_res = client.post(f"/api/v1/organizations/me/catalog-items/{item.slug}", headers=super_admin_headers)
    assert assoc_res.status_code == 200

    res = client.get("/api/v1/organizations/me/analytics", headers=super_admin_headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["currency"] == "EUR"
    catalog_types = {c["type"]: c["count"] for c in body["catalogByType"]}
    assert catalog_types.get("product") == 1
    roles = {r["roleCode"]: r["count"] for r in body["membersByRole"]}
    assert roles.get("content_creator") == 1
    # super_admin itself must never show up in the role breakdown — see
    # OrganizationCatalogRepository.members_by_role's explicit exclusion.
    assert "super_admin" not in roles
