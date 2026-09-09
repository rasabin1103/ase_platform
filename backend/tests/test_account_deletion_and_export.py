"""Targeted tests for the two most recently added danger-zone features:

1. Self-service account deletion (GDPR art. 17) — POST /auth/me/delete.
2. Backup-before-delete CSV/Excel export for the data-reset panel —
   POST /admin/data-reset/domain/{key}/rows/export.

Both exercise the real service layer against a real (disposable) Postgres,
matching this suite's existing pgserver-backed pattern (see conftest.py).
"""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import OrganizationType, RoleScope, UserStatus
from app.models.testimonial import Testimonial
from app.models.user import User
from tests.conftest import make_user_with_role


def test_delete_own_account_wrong_password_returns_401(client: TestClient, independent_headers):
    res = client.post("/api/v1/auth/me/delete", json={"password": "NotTheRealPassword!"}, headers=independent_headers)
    assert res.status_code == 401


def test_delete_own_account_deletes_and_anonymizes(client: TestClient, db: Session, independent_user: User, independent_headers):
    original_email = independent_user.email

    res = client.post("/api/v1/auth/me/delete", json={"password": "Test1234!"}, headers=independent_headers)
    assert res.status_code == 200, res.text

    db.expire_all()
    refreshed = db.execute(select(User).where(User.id == independent_user.id)).scalar_one()
    assert refreshed.status == UserStatus.deleted
    assert refreshed.email != original_email
    assert refreshed.email.startswith("deleted-")
    assert refreshed.display_name == "Deleted user"

    # Stateless JWT auth: the very next authenticated request against any
    # endpoint gated by get_current_active_user must be rejected now that
    # status is `deleted`, with no separate token-revocation step needed.
    # (GET /auth/me itself deliberately uses the weaker get_current_user —
    # it has to keep working for accounts suspended pending 2FA setup — so
    # it's not the right probe for this; a get_current_active_user-gated
    # route is.)
    gated_res = client.get("/api/v1/preferences-profile/me", headers=independent_headers)
    assert gated_res.status_code == 403


def test_delete_own_account_blocks_last_active_super_admin(client: TestClient, db: Session, super_admin_user: User, super_admin_headers):
    res = client.post("/api/v1/auth/me/delete", json={"password": "Test1234!"}, headers=super_admin_headers)
    assert res.status_code == 400, res.text

    db.expire_all()
    refreshed = db.execute(select(User).where(User.id == super_admin_user.id)).scalar_one()
    assert refreshed.status == UserStatus.active


def test_delete_own_account_allows_when_another_super_admin_exists(
    client: TestClient, db: Session, super_admin_user: User, super_admin_headers,
):
    # A second active super_admin means deleting the first one no longer
    # orphans the platform, so the same lockout guard must let it through.
    make_user_with_role(
        db,
        email="admin2@example.com",
        role_code="super_admin",
        org_type=OrganizationType.enterprise,
        role_scope=RoleScope.platform,
    )

    res = client.post("/api/v1/auth/me/delete", json={"password": "Test1234!"}, headers=super_admin_headers)
    assert res.status_code == 200, res.text

    db.expire_all()
    refreshed = db.execute(select(User).where(User.id == super_admin_user.id)).scalar_one()
    assert refreshed.status == UserStatus.deleted


def test_export_domain_table_rows_all_and_filtered(client: TestClient, db: Session, super_admin_headers):
    rows = [
        Testimonial(author_name=f"Author {i}", quote=f"Quote {i}", is_active=True)
        for i in range(3)
    ]
    db.add_all(rows)
    db.commit()
    for r in rows:
        db.refresh(r)

    # No ids -> every row currently in the table (the "back up before
    # wiping the whole domain" case).
    res_all = client.post(
        "/api/v1/admin/data-reset/domain/testimonials/rows/export",
        json={"table": "testimonials"},
        headers=super_admin_headers,
    )
    assert res_all.status_code == 200, res_all.text
    body_all = res_all.json()
    assert body_all["table"] == "testimonials"
    assert body_all["total"] == 3
    assert len(body_all["rows"]) == 3
    assert body_all["truncated"] is False
    assert "author_name" in body_all["columns"]
    assert "quote" in body_all["columns"]

    # A subset of ids -> only those rows (the "back up before deleting just
    # these" case).
    target_id = rows[0].id
    res_subset = client.post(
        "/api/v1/admin/data-reset/domain/testimonials/rows/export",
        json={"table": "testimonials", "ids": [target_id]},
        headers=super_admin_headers,
    )
    assert res_subset.status_code == 200, res_subset.text
    body_subset = res_subset.json()
    assert body_subset["total"] == 1
    assert len(body_subset["rows"]) == 1
    assert body_subset["rows"][0]["author_name"] == "Author 0"
