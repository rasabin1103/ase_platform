"""Validate MVP RBAC alignment between backend and frontend."""

from __future__ import annotations

import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from app.core.rbac import ROLE_PERMISSIONS, resolve_primary_role
from app.core.rbac_mvp import MVP_ROLE_CODES, MVP_ROLE_PERMISSIONS

FRONTEND_ROLE_NAV: dict[str, list[str]] = {
    "super_admin": ["/dashboard", "/admin/catalog", "/users", "/admin/purchases", "/requests", "/profile"],
    "independent_user": [
        "/dashboard",
        "/catalog/products",
        "/catalog/courses",
        "/catalog/books",
        "/catalog/resources",
        "/favorites",
        "/my-purchases",
        "/my-courses",
        "/my-books",
        "/my-resources",
        "/requests",
        "/profile",
    ],
}


def main() -> None:
    errors: list[str] = []
    if set(ROLE_PERMISSIONS.keys()) != MVP_ROLE_CODES:
        errors.append(f"ROLE_PERMISSIONS keys {set(ROLE_PERMISSIONS.keys())} != MVP {MVP_ROLE_CODES}")
    for role, perms in MVP_ROLE_PERMISSIONS.items():
        if ROLE_PERMISSIONS.get(role) != perms:
            errors.append(f"Permission mismatch for {role}")
    ind = ROLE_PERMISSIONS.get("independent_user", frozenset())
    for forbidden in ("organizations.read", "users.create", "catalog.manage"):
        if forbidden in ind:
            errors.append(f"independent_user must not have {forbidden}")
    for required in ("catalog.read", "favorites.manage_own", "purchases.manage_own"):
        if required not in ind:
            errors.append(f"independent_user must have {required}")
    if resolve_primary_role(["independent_user", "viewer"]) != "independent_user":
        errors.append("resolve_primary_role should prefer independent_user in MVP")
    if errors:
        print("RBAC consistency FAILED")
        for e in errors:
            print(" -", e)
        sys.exit(1)
    print("RBAC consistency OK")


if __name__ == "__main__":
    main()
