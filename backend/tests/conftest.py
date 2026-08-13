"""Shared pytest fixtures for the backend test suite.

Requires a real Postgres database (the app uses Postgres-only features —
JSONB, native enums, the ``?|`` array operator — so SQLite can't stand in).
Set TEST_DATABASE_URL to a *disposable* database before running pytest,
e.g.:

    export TEST_DATABASE_URL="postgresql+psycopg://user:pass@localhost:5432/ase_test"
    pytest

NEVER point TEST_DATABASE_URL at your real DATABASE_URL — every test
truncates every table before it runs. If TEST_DATABASE_URL isn't set, the
whole suite is skipped (not failed) so `pytest` is still safe to run
without a database configured.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import Base, get_db
from app.main import app
from app.models.enums import (
    MembershipStatus,
    OrganizationStatus,
    OrganizationType,
    RoleScope,
    UserStatus,
)
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User
from app.modules.auth.security import create_access_token, hash_password

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "")

_SKIP_REASON = (
    "TEST_DATABASE_URL is not set — point it at a disposable Postgres database "
    "(never your real DATABASE_URL; every test truncates all tables), e.g. "
    "postgresql+psycopg://user:pass@localhost:5432/ase_test"
)


@pytest.fixture(scope="session")
def engine():
    if not TEST_DATABASE_URL:
        pytest.skip(_SKIP_REASON)
    eng = create_engine(TEST_DATABASE_URL, connect_args={"prepare_threshold": None})
    Base.metadata.create_all(bind=eng)
    try:
        yield eng
    finally:
        Base.metadata.drop_all(bind=eng)
        eng.dispose()


@pytest.fixture()
def db(engine) -> Session:
    """Fresh session per test. Tables are truncated up front rather than
    relying on a rollback-per-test pattern, since the app's service layer
    calls db.commit() internally throughout — a savepoint/nested-transaction
    strategy would have to intercept every one of those. Truncate-before is
    simpler and just as isolated at this suite's size."""
    table_names = [t.name for t in Base.metadata.sorted_tables]
    if table_names:
        with engine.begin() as conn:
            conn.execute(text(f"TRUNCATE TABLE {', '.join(table_names)} RESTART IDENTITY CASCADE"))

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db: Session) -> TestClient:
    def _override_get_db():
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)


def _ensure_role(db: Session, code: str, *, scope: RoleScope) -> Role:
    role = db.query(Role).filter(Role.code == code).one_or_none()
    if role is None:
        role = Role(code=code, name=code.replace("_", " ").title(), scope=scope, description=None)
        db.add(role)
        db.commit()
        db.refresh(role)
    return role


def make_user_with_role(
    db: Session,
    *,
    email: str,
    role_code: str,
    org_type: OrganizationType,
    role_scope: RoleScope,
    password: str = "Test1234!",
) -> User:
    """Mirrors scripts/seed_demo_rbac.py's shape: a User needs an
    Organization + OrganizationMember + MemberRole chain to carry a role in
    this app's relational RBAC (there's no is_superuser/role_codes column)."""
    user = User(
        email=email,
        password_hash=hash_password(password),
        status=UserStatus.active,
        display_name=email.split("@")[0],
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    org = Organization(
        name=f"{role_code} org",
        slug=f"{role_code}-{user.id}",
        type=org_type,
        owner_user_id=user.id,
        status=OrganizationStatus.active,
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    member = OrganizationMember(
        organization_id=org.id,
        user_id=user.id,
        membership_status=MembershipStatus.active,
        joined_at=datetime.now(timezone.utc),
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    role = _ensure_role(db, role_code, scope=role_scope)
    db.add(MemberRole(organization_member_id=member.id, role_id=role.id, assigned_by_user_id=user.id))
    db.commit()

    return user


@pytest.fixture()
def super_admin_user(db: Session) -> User:
    return make_user_with_role(
        db,
        email="admin@example.test",
        role_code="super_admin",
        org_type=OrganizationType.enterprise,
        role_scope=RoleScope.platform,
    )


@pytest.fixture()
def independent_user(db: Session) -> User:
    return make_user_with_role(
        db,
        email="user@example.test",
        role_code="independent_user",
        org_type=OrganizationType.individual,
        role_scope=RoleScope.personal_workspace,
    )


def auth_headers(user: User) -> dict[str, str]:
    """Mints a real access token directly (same code path AuthService uses)
    instead of going through POST /auth/login — login is rate-limited
    (10/minute) which the full test suite would otherwise trip."""
    token = create_access_token(user_uuid=user.uuid)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def super_admin_headers(super_admin_user: User) -> dict[str, str]:
    return auth_headers(super_admin_user)


@pytest.fixture()
def independent_headers(independent_user: User) -> dict[str, str]:
    return auth_headers(independent_user)
