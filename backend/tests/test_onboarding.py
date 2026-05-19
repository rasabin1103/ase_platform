from __future__ import annotations

import secrets

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.main import create_app
from app.models.audit_log import AuditLog
from app.models.enums import MembershipStatus, OrganizationStatus, OrganizationType, RoleScope, UserStatus
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User
from app.modules.auth.security import create_access_token, hash_password


def test_onboarding_create_organization_happy_path():
    db = SessionLocal()
    try:
        # Ensure org_owner role exists
        role = db.execute(select(Role).where(Role.code == "org_owner")).scalar_one_or_none()
        if role is None:
            role = Role(code="org_owner", name="Org Owner", scope=RoleScope.organization)
            db.add(role)
            db.flush()

        u = User(
            email=f"onb_{secrets.token_hex(6)}@example.com",
            password_hash=hash_password("Password123!"),
            status=UserStatus.active,
        )
        db.add(u)
        db.commit()
        db.refresh(u)

        token = create_access_token(user_uuid=u.uuid)
        client = TestClient(create_app())

        slug = f"onb-org-{secrets.token_hex(6)}"
        res = client.post(
            "/api/v1/onboarding/create-organization",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "organization_name": "My Org",
                "organization_slug": slug,
                "organization_type": OrganizationType.business.value,
            },
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["organization_slug"] == slug

        org = db.execute(select(Organization).where(Organization.slug == slug)).scalar_one()
        assert org.owner_user_id == u.id
        assert org.status == OrganizationStatus.active

        member = db.execute(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org.id,
                OrganizationMember.user_id == u.id,
            )
        ).scalar_one()
        assert member.membership_status == MembershipStatus.active

        mr = db.execute(
            select(MemberRole).where(
                MemberRole.organization_member_id == member.id,
                MemberRole.role_id == role.id,
            )
        ).scalar_one()
        assert mr.assigned_by_user_id == u.id

        log = db.execute(
            select(AuditLog).where(
                AuditLog.organization_id == org.id,
                AuditLog.actor_user_id == u.id,
                AuditLog.action == "onboarding.create_organization",
            )
        ).scalar_one()
        assert log.entity_type == "organization"
        assert str(log.entity_id) == str(org.id)
    finally:
        db.close()


def test_onboarding_requires_org_owner_role():
    db = SessionLocal()
    old_code: str | None = None
    try:
        # Temporarily move org_owner code away to force "missing role" branch.
        role = db.execute(select(Role).where(Role.code == "org_owner")).scalar_one_or_none()
        if role is not None:
            old_code = role.code
            role.code = f"org_owner_tmp_{secrets.token_hex(6)}"
            db.commit()

        u = User(
            email=f"onb_{secrets.token_hex(6)}@example.com",
            password_hash=hash_password("Password123!"),
            status=UserStatus.active,
        )
        db.add(u)
        db.commit()
        db.refresh(u)

        token = create_access_token(user_uuid=u.uuid)
        client = TestClient(create_app())

        res = client.post(
            "/api/v1/onboarding/create-organization",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "organization_name": "My Org",
                "organization_slug": f"onb-org-{secrets.token_hex(6)}",
                "organization_type": OrganizationType.business.value,
            },
        )
        assert res.status_code == 400
        assert "org_owner" in res.text
    finally:
        if old_code is not None:
            role = db.execute(select(Role).where(Role.code.like("org_owner_tmp_%"))).scalar_one_or_none()
            if role is not None:
                role.code = old_code
                db.commit()
        db.close()


def test_onboarding_slug_duplicate_returns_400():
    db = SessionLocal()
    try:
        role = db.execute(select(Role).where(Role.code == "org_owner")).scalar_one_or_none()
        if role is None:
            role = Role(code="org_owner", name="Org Owner", scope=RoleScope.organization)
            db.add(role)
            db.flush()

        u = User(
            email=f"onb_{secrets.token_hex(6)}@example.com",
            password_hash=hash_password("Password123!"),
            status=UserStatus.active,
        )
        db.add(u)
        db.flush()

        slug = f"onb-org-{secrets.token_hex(6)}"
        org = Organization(
            name="Existing",
            slug=slug,
            type=OrganizationType.business,
            owner_user_id=u.id,
            status=OrganizationStatus.active,
        )
        db.add(org)
        db.commit()
        db.refresh(u)

        token = create_access_token(user_uuid=u.uuid)
        client = TestClient(create_app())

        res = client.post(
            "/api/v1/onboarding/create-organization",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "organization_name": "My Org",
                "organization_slug": slug,
                "organization_type": OrganizationType.business.value,
            },
        )
        assert res.status_code == 400
        assert "Slug already exists" in res.text
    finally:
        db.close()

