"""Full MVP database seed: roles → users → catalog."""
from __future__ import annotations

import _bootstrap  # noqa: F401

from seed_roles import main as seed_roles
from seed_users import main as seed_users


def main() -> None:
    print("=== seed_roles ===")
    seed_roles()
    print("=== seed_users ===")
    seed_users()
    print("=== seed_catalog ===")
    from seed_consumer_catalog import main as seed_catalog  # noqa: E402

    seed_catalog()
    print("=== seed_pricing_plans ===")
    from seed_pricing_plans import main as seed_pricing  # noqa: E402

    seed_pricing()
    print("=== MVP seed_all done ===")


if __name__ == "__main__":
    main()
