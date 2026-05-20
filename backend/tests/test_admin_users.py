"""Admin user management (super_admin) — MVP checks."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.enums import MembershipStatus, OrganizationStatus, OrganizationType, UserStatus
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User


def _auth_header(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(user_uuid=user.uuid)}"}


def _seed_super_admin(db, email: str) -> User:
    user = User(
        email=email,
        password_hash=hash_password("Password123!"),
        status=UserStatus.active,
        display_name="Test Super",
    )
    db.add(user)
    db.flush()
    slug = f"ase-platform-test-{uuid.uuid4().hex[:8]}"
    platform = Organization(
        name="ASE Platform Test",
        slug=slug,
        type=OrganizationType.enterprise,
        owner_user_id=user.id,
        status=OrganizationStatus.active,
    )
    db.add(platform)
    db.flush()
    role = db.execute(select(Role).where(Role.code == "super_admin")).scalar_one()
    member = OrganizationMember(
        organization_id=platform.id,
        user_id=user.id,
        membership_status=MembershipStatus.active,
    )
    db.add(member)
    db.flush()
    db.add(
        MemberRole(
            organization_member_id=member.id,
            role_id=role.id,
            assigned_by_user_id=user.id,
        )
    )
    db.commit()
    db.refresh(user)
    return user


def test_admin_users_forbidden_for_non_super_admin():
    client = TestClient(app)
    db = SessionLocal()
    try:
        user = User(
            email=f"guest_{uuid.uuid4().hex}@example.com",
            password_hash=hash_password("Password123!"),
            status=UserStatus.active,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        res = client.get("/api/v1/admin/users", headers=_auth_header(user))
        assert res.status_code == 403
    finally:
        db.close()


def test_create_deactivate_activate_delete_independent_user():
    client = TestClient(app)
    db = SessionLocal()
    try:
        admin = _seed_super_admin(db, f"admin_{uuid.uuid4().hex}@example.com")
        headers = _auth_header(admin)

        email = f"ind_{uuid.uuid4().hex}@example.com"
        create = client.post(
            "/api/v1/admin/users",
            headers=headers,
            json={
                "email": email,
                "password": "TempPass123!",
                "first_name": "Ind",
                "last_name": "User",
                "role": "independent_user",
                "status": "active",
            },
        )
        assert create.status_code == 201, create.text
        body = create.json()
        assert body["email"] == email
        assert body["primary_role"] == "independent_user"

        user_uuid = body["uuid"]
        deactivate = client.patch(
            f"/api/v1/admin/users/{user_uuid}/status",
            headers=headers,
            json={"status": "inactive"},
        )
        assert deactivate.status_code == 200

        login_fail = client.post("/api/v1/auth/login", json={"email": email, "password": "TempPass123!"})
        assert login_fail.status_code == 403
        assert login_fail.json()["detail"] == "User account is not active"

        activate = client.patch(
            f"/api/v1/admin/users/{user_uuid}/status",
            headers=headers,
            json={"status": "active"},
        )
        assert activate.status_code == 200
        login_ok = client.post("/api/v1/auth/login", json={"email": email, "password": "TempPass123!"})
        assert login_ok.status_code == 200

        delete = client.delete(f"/api/v1/admin/users/{user_uuid}", headers=headers)
        assert delete.status_code == 204
    finally:
        db.close()


def test_cannot_delete_self():
    client = TestClient(app)
    db = SessionLocal()
    try:
        admin = _seed_super_admin(db, f"self_{uuid.uuid4().hex}@example.com")
        headers = _auth_header(admin)
        res = client.delete(f"/api/v1/admin/users/{admin.uuid}", headers=headers)
        assert res.status_code == 400
        assert "your own" in res.json()["detail"].lower()
    finally:
        db.close()


def test_cannot_delete_last_super_admin():
    from unittest.mock import patch

    client = TestClient(app)
    db = SessionLocal()
    try:
        admin1 = _seed_super_admin(db, f"a1_{uuid.uuid4().hex}@example.com")
        admin2 = _seed_super_admin(db, f"a2_{uuid.uuid4().hex}@example.com")
        headers1 = _auth_header(admin1)
        with patch(
            "app.modules.admin_users.service.count_users_with_role",
            return_value=1,
        ):
            res = client.delete(f"/api/v1/admin/users/{admin2.uuid}", headers=headers1)
        assert res.status_code == 400
        assert "last super_admin" in res.json()["detail"].lower()
    finally:
        db.close()
