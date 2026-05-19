"""
Validate local tenant isolation through the FastAPI API.

Usage from repository root:
  python scripts/check_tenant_isolation.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPO_ROOT / "ase_backend"

os.chdir(BACKEND_ROOT)
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

import app.models  # noqa: E402, F401
from app.core.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.enums import UserStatus  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.organization_member import OrganizationMember  # noqa: E402
from app.models.user import User  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import select  # noqa: E402

PASSWORD = os.environ.get("DEMO_SEED_PASSWORD", "ChangeMeDemo123!")


def login(client: TestClient, email: str) -> str:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    if response.status_code != 200:
        raise AssertionError(f"Could not login as {email}: {response.status_code} {response.text}")
    return str(response.json()["access_token"])


def auth_headers(token: str, org_uuid: str | None = None) -> dict[str, str]:
    headers = {"Authorization": f"Bearer {token}"}
    if org_uuid:
        headers["X-Organization-UUID"] = org_uuid
    return headers


def get_json(client: TestClient, path: str, token: str, org_uuid: str | None = None) -> tuple[int, Any]:
    response = client.get(path, headers=auth_headers(token, org_uuid))
    try:
        body: Any = response.json()
    except Exception:
        body = response.text
    return response.status_code, body


def post_json(client: TestClient, path: str, token: str, org_uuid: str | None, payload: dict[str, Any]) -> tuple[int, Any]:
    response = client.post(path, headers=auth_headers(token, org_uuid), json=payload)
    try:
        body: Any = response.json()
    except Exception:
        body = response.text
    return response.status_code, body


def expected_org_user_emails(db, org_slug: str) -> set[str]:
    stmt = (
        select(User.email)
        .join(OrganizationMember, OrganizationMember.user_id == User.id)
        .join(Organization, Organization.id == OrganizationMember.organization_id)
        .where(Organization.slug == org_slug, User.status != UserStatus.deleted)
    )
    return set(db.execute(stmt).scalars().all())


def org_uuid_by_slug(db, slug: str) -> str:
    org = db.execute(select(Organization).where(Organization.slug == slug)).scalar_one()
    return str(org.uuid)


def assert_users_scope(
    *,
    client: TestClient,
    token: str,
    org_uuid: str | None,
    expected_emails: set[str],
    label: str,
    failures: list[str],
) -> None:
    status_code, body = get_json(client, "/api/v1/users", token, org_uuid)
    if status_code != 200:
        failures.append(f"{label}: expected 200 from /users, got {status_code} {body}")
        return
    actual = {item["email"] for item in body.get("items", [])}
    leaked = actual - expected_emails
    missing = expected_emails - actual
    if leaked:
        failures.append(f"{label}: leaked users outside tenant: {sorted(leaked)}")
    if missing:
        failures.append(f"{label}: missing tenant users: {sorted(missing)}")


def main() -> int:
    failures: list[str] = []
    rows: list[tuple[str, str, str]] = []

    with SessionLocal() as db:
        acme_uuid = org_uuid_by_slug(db, "acme-corporation")
        globex_uuid = org_uuid_by_slug(db, "globex-solutions")
        acme_users = expected_org_user_emails(db, "acme-corporation")
        globex_users = expected_org_user_emails(db, "globex-solutions")
        all_users = set(db.execute(select(User.email).where(User.status != UserStatus.deleted)).scalars().all())

    with TestClient(app) as client:
        super_token = login(client, "rasabin01@gmail.com")
        acme_owner_token = login(client, "rasabin02@gmail.com")
        globex_owner_token = login(client, "rasabin09@gmail.com")
        multi_token = login(client, "rasabin10@gmail.com")
        viewer_token = login(client, "rasabin05@gmail.com")
        no_org_token = login(client, "rasabin06@gmail.com")

        status_code, body = get_json(client, "/api/v1/users", super_token)
        actual_all = {item["email"] for item in body.get("items", [])} if status_code == 200 else set()
        if status_code != 200 or not all_users.issubset(actual_all):
            failures.append(f"super_admin: expected global users, got {status_code} {body}")
        rows.append(("rasabin01@gmail.com", "global users", "OK" if status_code == 200 else "FAIL"))

        status_code, body = get_json(client, "/api/v1/organizations", super_token)
        org_count = len(body.get("items", [])) if status_code == 200 else 0
        if status_code != 200 or org_count < 4:
            failures.append(f"super_admin: expected all organizations, got {status_code} {body}")
        rows.append(("rasabin01@gmail.com", "global organizations", "OK" if status_code == 200 and org_count >= 4 else "FAIL"))

        before = len(failures)
        assert_users_scope(
            client=client,
            token=acme_owner_token,
            org_uuid=acme_uuid,
            expected_emails=acme_users,
            label="rasabin02 Acme",
            failures=failures,
        )
        rows.append(("rasabin02@gmail.com", "Acme users only", "OK" if len(failures) == before else "FAIL"))

        before = len(failures)
        assert_users_scope(
            client=client,
            token=globex_owner_token,
            org_uuid=globex_uuid,
            expected_emails=globex_users,
            label="rasabin09 Globex",
            failures=failures,
        )
        rows.append(("rasabin09@gmail.com", "Globex users only", "OK" if len(failures) == before else "FAIL"))

        before = len(failures)
        assert_users_scope(
            client=client,
            token=multi_token,
            org_uuid=acme_uuid,
            expected_emails=acme_users,
            label="rasabin10 Acme",
            failures=failures,
        )
        rows.append(("rasabin10@gmail.com", "Acme context", "OK" if len(failures) == before else "FAIL"))

        status_code, body = get_json(client, "/api/v1/users", multi_token, globex_uuid)
        if status_code == 200:
            actual = {item["email"] for item in body.get("items", [])}
            leaked = actual - globex_users
            if leaked:
                failures.append(f"rasabin10 Globex: leaked users outside tenant: {sorted(leaked)}")
            rows.append(("rasabin10@gmail.com", "Globex context", "OK" if not leaked else "FAIL"))
        elif status_code == 403:
            rows.append(("rasabin10@gmail.com", "Globex context", "OK (viewer cannot read users)"))
        else:
            failures.append(f"rasabin10 Globex: expected 200 or 403, got {status_code} {body}")
            rows.append(("rasabin10@gmail.com", "Globex context", "FAIL"))

        status_code, _ = post_json(
            client,
            "/api/v1/users",
            viewer_token,
            acme_uuid,
            {"email": "tenant-write-check@example.test", "plain_password": "not-used-123"},
        )
        if status_code != 403:
            failures.append(f"rasabin05 viewer: expected write denial, got {status_code}")
        rows.append(("rasabin05@gmail.com", "write denied", "OK" if status_code == 403 else "FAIL"))

        status_code, _ = get_json(client, "/api/v1/users", no_org_token)
        if status_code not in (400, 403):
            failures.append(f"rasabin06 no org: expected organizational access denial, got {status_code}")
        rows.append(("rasabin06@gmail.com", "no org denied", "OK" if status_code in (400, 403) else "FAIL"))

    print("\nTenant isolation check")
    print("-" * 78)
    print(f"{'email':<24} {'check':<28} status")
    print("-" * 78)
    for email, check, result in rows:
        print(f"{email:<24} {check:<28} {result}")

    if failures:
        print("\nFAILURES")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("\nAll tenant isolation checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
