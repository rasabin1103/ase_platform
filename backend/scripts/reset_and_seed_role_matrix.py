"""
Reset-sync RBAC matrix and demo users for role testing.

Runs seed_initial_data (roles/permissions) then seed_demo_rbac (users/orgs/requests).

Usage:
  python scripts/reset_and_seed_role_matrix.py
"""

from __future__ import annotations

import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from scripts.seed_demo_rbac import seed_demo_rbac
from scripts.seed_initial_data import seed


def main() -> None:
    base = seed()
    demo = seed_demo_rbac()
    print("Role matrix + demo seed completed")
    print(
        f"permissions_created={base.created_permissions} "
        f"role_permissions_synced=+{base.created_role_permissions}/-{base.removed_role_permissions}"
    )
    print(
        f"demo_users={demo.created_users} demo_orgs={demo.created_orgs} "
        f"demo_requests={demo.created_requests}"
    )


if __name__ == "__main__":
    main()
