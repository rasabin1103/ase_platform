from __future__ import annotations

from datetime import datetime, timezone
import secrets

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.models.enums import MembershipStatus, RoleScope, UserStatus
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.modules.auth.dependencies import require_permission
from app.core.security import create_access_token, hash_password


def _make_test_app(*, perm_code: str) -> FastAPI:
    app = FastAPI()

    @app.get("/protected")
    def protected(_=Depends(require_permission(perm_code))):
        return {"ok": True}

    return app


def test_permission_denied_without_role():
    db = SessionLocal()
    try:
        perm_code = f"perm.test.{secrets.token_hex(6)}"
        s = secrets.token_hex(6)
        user = User(email=f"rbac1_{s}@example.com", password_hash=hash_password("Password123!"), status=UserStatus.active)
        db.add(user)
        db.flush()

        org = Organization(
            name="Org",
            slug=f"rbac-org-1-{secrets.token_hex(6)}",
            type="business",
            owner_user_id=user.id,
            status="active",
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
        db.commit()

        token = create_access_token(user_uuid=user.uuid)
        client = TestClient(_make_test_app(perm_code=perm_code))
        res = client.get("/protected", params={"organization_id": org.id}, headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 403
    finally:
        db.close()


def test_permission_allowed_with_role_permission():
    db = SessionLocal()
    try:
        perm_code = f"perm.test.{secrets.token_hex(6)}"
        s = secrets.token_hex(6)
        user = User(email=f"rbac2_{s}@example.com", password_hash=hash_password("Password123!"), status=UserStatus.active)
        db.add(user)
        db.flush()

        org = Organization(
            name="Org2",
            slug=f"rbac-org-2-{secrets.token_hex(6)}",
            type="business",
            owner_user_id=user.id,
            status="active",
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

        role = Role(code=f"rbac_role_{secrets.token_hex(4)}", name="RBAC Role", scope=RoleScope.organization)
        perm = Permission(code=perm_code, name="Perm Test", module="test")
        db.add_all([role, perm])
        db.flush()

        db.add(RolePermission(role_id=role.id, permission_id=perm.id))
        db.add(MemberRole(organization_member_id=member.id, role_id=role.id, assigned_by_user_id=user.id))
        db.commit()

        token = create_access_token(user_uuid=user.uuid)
        client = TestClient(_make_test_app(perm_code=perm_code))
        res = client.get("/protected", params={"organization_id": org.id}, headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        assert res.json() == {"ok": True}
    finally:
        db.close()

