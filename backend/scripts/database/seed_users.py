"""Seed MVP demo users: super_admin + independent users (idempotent)."""
from __future__ import annotations

import _bootstrap  # noqa: F401

from seed_demo_rbac import seed_demo_rbac  # noqa: E402


def main() -> None:
    result = seed_demo_rbac()
    print("seed_users completed:", result)


if __name__ == "__main__":
    main()
