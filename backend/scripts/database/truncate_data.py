"""Truncate application data (keeps schema and alembic_version)."""
from __future__ import annotations

import _bootstrap  # noqa: F401

import os
import sys
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from sqlalchemy import text  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

import app.models  # noqa: E402, F401
from app.core.database import Base, SessionLocal  # noqa: E402

_ALEMBIC_TABLE = "alembic_version"


def main() -> None:
    tables = [t.name for t in Base.metadata.sorted_tables if t.name != _ALEMBIC_TABLE]
    if not tables:
        print("No tables to truncate.")
        return
    quoted = ", ".join(f'"{name}"' for name in tables)
    sql = f"TRUNCATE TABLE {quoted} RESTART IDENTITY CASCADE"
    db: Session = SessionLocal()
    try:
        db.execute(text(sql))
        db.commit()
        print(f"Truncated {len(tables)} tables (schema preserved).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
