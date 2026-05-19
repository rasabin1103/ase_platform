"""Seed demo consumer catalog items (idempotent)."""
from __future__ import annotations

import _bootstrap  # noqa: F401

if __name__ == "__main__":
    from seed_consumer_catalog import main as run  # noqa: E402

    run()
