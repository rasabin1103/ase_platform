"""
Full reset + baseline catalog + single super-admin tenant for RBAC and frontend testing.

Steps:
  1) Truncate application tables (same rules as ``reset_database.py``).
  2) Seed roles, permissions, role_permissions, plans, products, plan_products
     (via ``ase_backend/scripts/seed_initial_data.py``).
  3) Ensure role ``super_admin`` has every ``permissions`` row.
  4) Create one active user, one enterprise organization, active membership,
     and ``member_roles`` for ``super_admin`` (assigned_by = same user).

The ``users`` table has no ``is_superuser`` column; superuser capability is the
``super_admin`` role. ``GET /api/v1/auth/me`` exposes ``is_superuser`` when that
role is assigned, and ``organization_uuid`` for the first active membership.
Send ``X-Organization-UUID`` on tenant-scoped routes using that UUID.

Usage (from repository root, with DATABASE_URL set in backend/.env):

  python scripts/reset_and_seed_super_admin.py
"""

from __future__ import annotations

import importlib.util
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPO_ROOT / "ase_backend"
_SCRIPTS_DIR = REPO_ROOT / "scripts"

os.chdir(BACKEND_ROOT)
for p in (str(BACKEND_ROOT), str(_SCRIPTS_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from sqlalchemy import select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

import app.models  # noqa: E402, F401
from app.core.database import SessionLocal  # noqa: E402
from app.models.enums import MembershipStatus, OrganizationStatus, OrganizationType, UserStatus  # noqa: E402
from app.models.member_role import MemberRole  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.organization_member import OrganizationMember  # noqa: E402
from app.models.permission import Permission  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.role_permission import RolePermission  # noqa: E402
from app.models.user import User  # noqa: E402
from app.modules.auth.dependencies import user_has_role_assigned  # noqa: E402
from app.modules.auth.security import hash_password, verify_password  # noqa: E402

from reset_database import truncate_application_tables  # noqa: E402

SUPER_EMAIL = "rasabin1103@gmail.com"
SUPER_PASSWORD_PLAIN = os.environ.get("DEMO_SEED_PASSWORD", "ChangeMeDemo123!")
SUPER_FIRST_NAME = "Roberto"
SUPER_LAST_NAME = "Arce"
SUPER_DISPLAY_NAME = "Roberto Arce"

ORG_NAME = "Arce Sabin Engineering"
ORG_SLUG = "arce-sabin-engineering"


def _load_seed_module():
    path = BACKEND_ROOT / "scripts" / "seed_initial_data.py"
    name = "_ase_seed_initial_data"
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


def ensure_super_admin_has_all_permissions(db: Session) -> int:
    role = db.execute(select(Role).where(Role.code == "super_admin")).scalar_one_or_none()
    if role is None:
        raise RuntimeError("Expected role 'super_admin' after baseline seed")

    added = 0
    for perm in db.execute(select(Permission)).scalars().all():
        exists = (
            db.execute(
                select(RolePermission.id).where(
                    RolePermission.role_id == role.id,
                    RolePermission.permission_id == perm.id,
                )
            ).scalar_one_or_none()
            is not None
        )
        if not exists:
            db.add(RolePermission(role_id=role.id, permission_id=perm.id))
            db.flush()
            added += 1
    return added


def assert_post_seed_integrity(db: Session, *, user_id: int) -> None:
    if not user_has_role_assigned(db, user_id=user_id, role_code="super_admin"):
        raise RuntimeError("super_admin role not assigned to seeded user")
    perm_total = db.execute(select(Permission.id)).scalars().all()
    role = db.execute(select(Role).where(Role.code == "super_admin")).scalar_one()
    rp_total = db.execute(select(RolePermission.id).where(RolePermission.role_id == role.id)).scalars().all()
    if len(rp_total) < len(perm_total):
        raise RuntimeError("super_admin is missing one or more permissions")
    if not verify_password(SUPER_PASSWORD_PLAIN, db.execute(select(User).where(User.id == user_id)).scalar_one().password_hash):
        raise RuntimeError("Password hash verification failed after seed")


def main() -> None:
    seed_mod = _load_seed_module()
    db = SessionLocal()
    try:
        truncate_application_tables(db)
        seed_result = seed_mod.seed_db(db)
        extra_rp = ensure_super_admin_has_all_permissions(db)

        user = User(
            email=SUPER_EMAIL,
            password_hash=hash_password(SUPER_PASSWORD_PLAIN),
            first_name=SUPER_FIRST_NAME,
            last_name=SUPER_LAST_NAME,
            display_name=SUPER_DISPLAY_NAME,
            status=UserStatus.active,
        )
        db.add(user)
        db.flush()

        org = Organization(
            name=ORG_NAME,
            slug=ORG_SLUG,
            type=OrganizationType.enterprise,
            owner_user_id=user.id,
            status=OrganizationStatus.active,
        )
        db.add(org)
        db.flush()

        member = OrganizationMember(
            organization_id=org.id,
            user_id=user.id,
            membership_status=MembershipStatus.active,
        )
        db.add(member)
        db.flush()

        super_role = db.execute(select(Role).where(Role.code == "super_admin")).scalar_one()
        db.add(
            MemberRole(
                organization_member_id=member.id,
                role_id=super_role.id,
                assigned_by_user_id=user.id,
            )
        )
        db.flush()

        assert_post_seed_integrity(db, user_id=user.id)

        db.commit()

        db.refresh(user)
        db.refresh(org)

        print("Reset + seed completed.")
        print(f"  Seed catalog: roles+perms etc. from seed_initial_data (see script output counters).")
        print(
            f"  seed_initial_data counters: created_roles={seed_result.created_roles} "
            f"created_permissions={seed_result.created_permissions} "
            f"created_role_permissions={seed_result.created_role_permissions} "
            f"created_plans={seed_result.created_plans} "
            f"created_products={seed_result.created_products} "
            f"created_plan_products={seed_result.created_plan_products} "
            f"created_services={seed_result.created_services}"
        )
        print(f"  Extra role_permissions linked for super_admin (beyond seed): {extra_rp}")
        print(f"  User email: {SUPER_EMAIL}")
        print(f"  User uuid: {user.uuid}")
        print(f"  Organization: {org.name} slug={org.slug}")
        print(f"  Organization uuid (use as X-Organization-UUID): {org.uuid}")
        print("  Login: POST /api/v1/auth/login")
        print("  Me (includes organization_uuid, is_superuser): GET /api/v1/auth/me")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
