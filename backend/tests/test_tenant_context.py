from __future__ import annotations

import secrets

from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.models.enums import MembershipStatus, OrganizationStatus, UserStatus
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.modules.auth.dependencies import get_current_organization
from app.core.security import create_access_token, hash_password


def _make_app() -> FastAPI:
    app = FastAPI()

    @app.get("/org")
    def org_endpoint(org=Depends(get_current_organization)):
        return {"org_uuid": str(org.uuid)}

    return app


def test_missing_header_returns_400():
    client = TestClient(_make_app())
    res = client.get("/org")
    assert res.status_code == 400


def test_org_context_denies_foreign_org_403():
    db = SessionLocal()
    try:
        s1 = secrets.token_hex(6)
        s2 = secrets.token_hex(6)
        u1 = User(email=f"tc_u1_{s1}@example.com", password_hash=hash_password("Password123!"), status=UserStatus.active)
        u2 = User(email=f"tc_u2_{s2}@example.com", password_hash=hash_password("Password123!"), status=UserStatus.active)
        db.add_all([u1, u2])
        db.flush()

        slug1 = f"tc-org-1-{secrets.token_hex(6)}"
        slug2 = f"tc-org-2-{secrets.token_hex(6)}"
        org1 = Organization(
            name="Org1",
            slug=slug1,
            type="business",
            owner_user_id=u1.id,
            status=OrganizationStatus.active,
        )
        org2 = Organization(
            name="Org2",
            slug=slug2,
            type="business",
            owner_user_id=u2.id,
            status=OrganizationStatus.active,
        )
        db.add_all([org1, org2])
        db.flush()

        db.add(
            OrganizationMember(
                organization_id=org1.id,
                user_id=u1.id,
                membership_status=MembershipStatus.active,
            )
        )
        db.commit()

        token = create_access_token(user_uuid=u1.uuid)
        client = TestClient(_make_app())
        res = client.get(
            "/org",
            headers={"Authorization": f"Bearer {token}", "X-Organization-UUID": str(org2.uuid)},
        )
        assert res.status_code == 403
    finally:
        db.close()


def test_org_context_allows_member_200():
    db = SessionLocal()
    try:
        s = secrets.token_hex(6)
        u = User(email=f"tc_u3_{s}@example.com", password_hash=hash_password("Password123!"), status=UserStatus.active)
        db.add(u)
        db.flush()

        org = Organization(
            name="Org3",
            slug=f"tc-org-3-{secrets.token_hex(6)}",
            type="business",
            owner_user_id=u.id,
            status=OrganizationStatus.active,
        )
        db.add(org)
        db.flush()

        db.add(
            OrganizationMember(
                organization_id=org.id,
                user_id=u.id,
                membership_status=MembershipStatus.active,
            )
        )
        db.commit()

        token = create_access_token(user_uuid=u.uuid)
        client = TestClient(_make_app())
        res = client.get(
            "/org",
            headers={"Authorization": f"Bearer {token}", "X-Organization-UUID": str(org.uuid)},
        )
        assert res.status_code == 200
        assert res.json()["org_uuid"] == str(org.uuid)
    finally:
        db.close()

