"""Solicitudes de organización: el owner/admin las gestiona y puede escalarlas
al equipo de la plataforma; el listado global solo lo ve super_admin."""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import MembershipStatus, OrganizationType, RoleScope, UserStatus
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.modules.auth.security import hash_password
from tests.conftest import _ensure_role, auth_headers, make_user_with_role


def _grant(db: Session, role_code: str, scope: RoleScope, codes: set[str]) -> None:
    role = _ensure_role(db, role_code, scope=scope)
    for code in codes:
        perm = db.execute(select(Permission).where(Permission.code == code)).scalar_one_or_none()
        if perm is None:
            perm = Permission(code=code, name=code, module=code.split(".")[0])
            db.add(perm)
            db.flush()
        exists = db.execute(
            select(RolePermission).where(
                RolePermission.role_id == role.id, RolePermission.permission_id == perm.id
            )
        ).scalar_one_or_none()
        if exists is None:
            db.add(RolePermission(role_id=role.id, permission_id=perm.id))
    db.commit()


def _setup_org(db: Session) -> tuple[User, User, Organization]:
    _grant(db, "org_owner", RoleScope.organization, {"requests.read", "requests.approve", "requests.create", "users.update"})
    _grant(db, "member", RoleScope.organization, {"requests.create", "requests.read_own"})
    owner = make_user_with_role(
        db,
        email="owner@example.com",
        role_code="org_owner",
        org_type=OrganizationType.enterprise,
        role_scope=RoleScope.organization,
    )
    org = db.execute(select(Organization).where(Organization.owner_user_id == owner.id)).scalar_one()
    member = User(
        email="member@example.com",
        password_hash=hash_password("Test1234!"),
        status=UserStatus.active,
        display_name="member",
    )
    db.add(member)
    db.commit()
    om = OrganizationMember(
        organization_id=org.id,
        user_id=member.id,
        membership_status=MembershipStatus.active,
        joined_at=datetime.now(timezone.utc),
    )
    db.add(om)
    db.commit()
    role = db.execute(select(Role).where(Role.code == "member")).scalar_one()
    db.add(MemberRole(organization_member_id=om.id, role_id=role.id, assigned_by_user_id=owner.id))
    db.commit()
    return owner, member, org


def _h(user: User, org: Organization) -> dict[str, str]:
    return {**auth_headers(user), "X-Organization-UUID": str(org.uuid)}


def test_admin_access_request_list_is_platform_only(client, independent_headers, super_admin_headers):
    assert client.get("/api/v1/admin/access-requests", headers=independent_headers).status_code == 403
    assert client.get("/api/v1/admin/access-requests", headers=super_admin_headers).status_code == 200


def test_org_owner_escalates_member_request(client, db, super_admin_headers):
    owner, member, org = _setup_org(db)
    created = client.post(
        "/api/v1/access-requests",
        headers=_h(member, org),
        json={
            "request_type": "resource_access",
            "target_entity_type": "resource",
            "target_entity_id": "42",
            "title": "Acceso a la plantilla de regresión",
        },
    )
    assert created.status_code == 201, created.text
    rid = created.json()["id"]

    # El owner ve la solicitud de su miembro, con quién la pidió.
    listed = client.get("/api/v1/access-requests?status=pending", headers=_h(owner, org))
    assert listed.status_code == 200
    row = next(i for i in listed.json()["items"] if i["id"] == rid)
    assert row["requested_by_email"] == "member@example.com"

    # Un miembro no puede escalar.
    assert (
        client.post(f"/api/v1/access-requests/{rid}/escalate", headers=_h(member, org), json={}).status_code
        == 403
    )

    esc = client.post(
        f"/api/v1/access-requests/{rid}/escalate",
        headers=_h(owner, org),
        json={"note": "Necesita la plataforma"},
    )
    assert esc.status_code == 200, esc.text
    assert esc.json()["escalated_at"]
    assert esc.json()["escalation_note"] == "Necesita la plataforma"

    again = client.post(f"/api/v1/access-requests/{rid}/escalate", headers=_h(owner, org), json={})
    assert again.status_code == 409

    admin = client.get("/api/v1/admin/access-requests?escalated=true", headers=super_admin_headers)
    assert admin.status_code == 200, admin.text
    items = admin.json()["items"]
    assert [i["id"] for i in items] == [rid]
    assert items[0]["organization_name"] == org.name
    assert items[0]["escalation_note"] == "Necesita la plataforma"

    # El owner puede rechazar con motivo y el miembro lo ve.
    rej = client.post(
        f"/api/v1/access-requests/{rid}/reject",
        headers=_h(owner, org),
        json={"admin_notes": "Ya la tiene tu equipo"},
    )
    assert rej.status_code == 200, rej.text
    assert rej.json()["status"] == "rejected"
    assert rej.json()["admin_notes"] == "Ya la tiene tu equipo"
