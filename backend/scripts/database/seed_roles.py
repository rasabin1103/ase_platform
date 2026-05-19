"""Sync MVP roles and permissions from rbac.py (idempotent)."""
from __future__ import annotations

import _bootstrap  # noqa: F401

from seed_initial_data import seed  # noqa: E402


def main() -> None:
    result = seed()
    print("seed_roles completed:", result)


if __name__ == "__main__":
    main()
