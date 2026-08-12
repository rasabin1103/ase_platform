from __future__ import annotations

import secrets
from datetime import datetime, timezone
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.main import app
from app.models.catalog_item import CatalogItem
from app.models.catalog_purchase import CatalogPurchase
from app.models.enums import (
    CatalogItemLevel,
    CatalogItemStatus,
    CatalogItemType,
    MembershipStatus,
    OrganizationStatus,
    OrganizationType,
    RoleScope,
    UserStatus,
)
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.modules.auth.security import create_access_token, hash_password

INDEPENDENT_ROLE_CODE = "independent_user"
PURCHASE_PERMISSION_CODE = "purchases.manage_own"


def _get_or_create_role(db: Session, *, code: str, scope: RoleScope) -> Role:
    role = db.execute(select(Role).where(Role.code == code)).scalar_one_or_none()
    if role is None:
        role = Role(code=code, name=code, scope=scope)
        db.add(role)
        db.flush()
    return role


def _get_or_create_permission(db: Session, *, code: str) -> Permission:
    perm = db.execute(select(Permission).where(Permission.code == code)).scalar_one_or_none()
    if perm is None:
        perm = Permission(code=code, name=code, module="consumer_catalog")
        db.add(perm)
        db.flush()
    return perm


def _ensure_role_has_permission(db: Session, *, role: Role, permission: Permission) -> None:
    existing = db.execute(
        select(RolePermission).where(
            RolePermission.role_id == role.id, RolePermission.permission_id == permission.id,
        )
    ).scalar_one_or_none()
    if existing is None:
        db.add(RolePermission(role_id=role.id, permission_id=permission.id))
        db.flush()


def _make_independent_user(db: Session, *, email_verified: bool) -> User:
    """Builds a user with a personal (individual-type) workspace and the
    independent_user role — the same shape a real self-service consumer
    ends up with — so purchase-permission checks pass and we can isolate
    the email-verification gate specifically."""
    user = User(
        email=f"buyer_{secrets.token_hex(6)}@example.com",
        password_hash=hash_password("Password123!"),
        status=UserStatus.active,
        email_verified_at=datetime.now(timezone.utc) if email_verified else None,
    )
    db.add(user)
    db.flush()

    org = Organization(
        name="Personal workspace",
        slug=f"personal-{secrets.token_hex(6)}",
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

    role = _get_or_create_role(db, code=INDEPENDENT_ROLE_CODE, scope=RoleScope.personal_workspace)
    permission = _get_or_create_permission(db, code=PURCHASE_PERMISSION_CODE)
    _ensure_role_has_permission(db, role=role, permission=permission)
    db.add(MemberRole(organization_member_id=member.id, role_id=role.id, assigned_by_user_id=user.id))
    db.commit()
    db.refresh(user)
    return user


def _make_catalog_item(db: Session, *, status: CatalogItemStatus = CatalogItemStatus.published) -> CatalogItem:
    item = CatalogItem(
        title="Test Product",
        slug=f"test-product-{secrets.token_hex(6)}",
        type=CatalogItemType.product,
        category="testing",
        short_description="Short description",
        long_description="Long description",
        image_url="https://example.com/image.png",
        price=Decimal("29.00"),
        currency="EUR",
        status=status,
        level=CatalogItemLevel.beginner,
        author="ASE",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def test_purchase_blocked_when_email_unverified():
    db = SessionLocal()
    try:
        user = _make_independent_user(db, email_verified=False)
        item = _make_catalog_item(db)
        token = create_access_token(user_uuid=user.uuid)

        client = TestClient(app)
        res = client.post(
            f"/api/v1/consumer-catalog/{item.slug}/purchase",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403
        assert "verify your email" in res.text.lower()

        purchased = db.execute(
            select(CatalogPurchase).where(
                CatalogPurchase.user_id == user.id, CatalogPurchase.catalog_item_id == item.id,
            )
        ).scalar_one_or_none()
        assert purchased is None
    finally:
        db.close()


def test_purchase_succeeds_when_email_verified():
    db = SessionLocal()
    try:
        user = _make_independent_user(db, email_verified=True)
        item = _make_catalog_item(db)
        token = create_access_token(user_uuid=user.uuid)

        client = TestClient(app)
        res = client.post(
            f"/api/v1/consumer-catalog/{item.slug}/purchase",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200, res.text
        assert res.json()["isPurchased"] is True

        purchased = db.execute(
            select(CatalogPurchase).where(
                CatalogPurchase.user_id == user.id, CatalogPurchase.catalog_item_id == item.id,
            )
        ).scalar_one_or_none()
        assert purchased is not None

        state_res = client.get(
            "/api/v1/consumer-catalog/me/state", headers={"Authorization": f"Bearer {token}"},
        )
        assert state_res.status_code == 200
        assert item.slug in state_res.json()["purchased_slugs"]
    finally:
        db.close()


def test_purchase_unknown_slug_returns_404():
    db = SessionLocal()
    try:
        user = _make_independent_user(db, email_verified=True)
        token = create_access_token(user_uuid=user.uuid)

        client = TestClient(app)
        res = client.post(
            f"/api/v1/consumer-catalog/does-not-exist-{secrets.token_hex(6)}/purchase",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 404
    finally:
        db.close()
