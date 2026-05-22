from __future__ import annotations

import secrets

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.main import create_app
from app.models.enums import RoleScope, UserStatus
from app.models.role import Role
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.models.user_platform_role import UserPlatformRole
from app.modules.auth.platform_roles import user_has_platform_role


def test_register_assigns_independent_without_organization():
    db = SessionLocal()
    email = f"ind_{secrets.token_hex(6)}@example.com"
    password = "Password123!"
    try:
        role = db.execute(select(Role).where(Role.code == "independent_user")).scalar_one_or_none()
        if role is None:
            role = Role(
                code="independent_user",
                name="Independent User",
                scope=RoleScope.personal_workspace,
            )
            db.add(role)
            db.commit()

        client = TestClient(create_app())
        res = client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "plain_password": password,
                "display_name": "Test Independent",
            },
        )
        assert res.status_code == 201, res.text
        body = res.json()
        assert body["status"] == "active"
        assert body["primary_role"] == "independent_user"
        assert body["dashboard_mode"] == "independent"
        assert body["is_independent_user"] is True
        assert body["organization_uuid"] is None
        assert body["active_workspace_uuid"] is None

        user = db.execute(select(User).where(User.email == email)).scalar_one()
        assert user_has_platform_role(db, user_id=user.id, role_code="independent_user")

        members = db.execute(
            select(OrganizationMember).where(OrganizationMember.user_id == user.id)
        ).scalars().all()
        assert members == []

        platform_roles = db.execute(
            select(UserPlatformRole).where(UserPlatformRole.user_id == user.id)
        ).scalars().all()
        assert len(platform_roles) == 1

        login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
        assert login.status_code == 200, login.text
        token = login.json()["access_token"]

        me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200, me.text
        me_body = me.json()
        assert me_body["dashboard_mode"] == "independent"
        assert me_body["organization_uuid"] is None

        workspaces = client.get("/api/v1/auth/workspaces", headers={"Authorization": f"Bearer {token}"})
        assert workspaces.status_code == 200
        assert workspaces.json()["items"] == []
    finally:
        u = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
        if u is not None:
            for row in db.execute(select(UserPlatformRole).where(UserPlatformRole.user_id == u.id)).scalars():
                db.delete(row)
            db.delete(u)
            db.commit()
        db.close()
