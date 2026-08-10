"""Verify ``DATABASE_URL`` with a trivial ``SELECT 1`` (no secrets printed).

Run from repo root or ``backend/``:

  python scripts/maintenance/check_db_connection.py
"""

from __future__ import annotations

import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from sqlalchemy import text

from app.core.database import engine


def main() -> None:
    with engine.connect() as conn:
        one = conn.execute(text("SELECT 1")).scalar()
    print("db_ok", bool(one))


if __name__ == "__main__":
    main()
