"""One-off diagnostic: what does the live DB actually contain vs. what Alembic thinks.

Run with: python -m scripts.check_db_state
"""
from __future__ import annotations

import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from sqlalchemy import text

from app.core.database import engine

KNOWN_TABLES = [
    "users", "roles", "permissions", "role_permissions",
    "organizations", "organization_members",
    "plans", "plan_features", "products", "plan_products", "subscriptions",
    "catalog_items", "catalog_purchases", "catalog_favorites",
    "organization_catalog_items",
    "courses", "course_enrollments", "invitations",
    "access_requests", "resource_assignments",
    "team_members", "testimonials", "case_studies", "services",
    "alembic_version",
]

with engine.connect() as conn:
    print("=== alembic_version table contents ===")
    try:
        rows = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
        for r in rows:
            print(f"  {r[0]}")
        if not rows:
            print("  (empty)")
    except Exception as e:
        print(f"  ERROR reading alembic_version: {e}")

    print("\n=== tables present in public schema ===")
    existing = {
        r[0]
        for r in conn.execute(
            text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
        ).fetchall()
    }
    for t in sorted(existing):
        print(f"  {t}")

    print("\n=== known-table checklist ===")
    for t in KNOWN_TABLES:
        mark = "OK" if t in existing else "MISSING"
        print(f"  [{mark:7}] {t}")
