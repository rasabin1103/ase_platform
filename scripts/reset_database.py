"""
Truncate all application data while preserving schema and the Alembic revision row.

Safe defaults:
  - Does not drop tables or run migrations.
  - Leaves ``alembic_version`` untouched.
  - Uses PostgreSQL TRUNCATE ... RESTART IDENTITY CASCADE when connected to Postgres.

Usage (from repository root):

  python scripts/reset_database.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1] / "ase_backend"
os.chdir(BACKEND_ROOT)
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import text  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

import app.models  # noqa: E402, F401 — register metadata tables
from app.core.database import Base, SessionLocal  # noqa: E402

SKIP_TABLES = frozenset({"alembic_version"})


def truncate_application_tables(session: Session) -> None:
    tables = [t for t in Base.metadata.sorted_tables if t.name not in SKIP_TABLES]
    if not tables:
        return
    dialect = session.get_bind().dialect.name
    if dialect == "postgresql":
        names = ", ".join(f'"{t.name}"' for t in tables)
        session.execute(text(f"TRUNCATE TABLE {names} RESTART IDENTITY CASCADE"))
        return
    if dialect == "sqlite":
        session.execute(text("PRAGMA foreign_keys=OFF"))
        for t in reversed(tables):
            session.execute(t.delete())
        session.execute(text("PRAGMA foreign_keys=ON"))
        return
    for t in reversed(tables):
        session.execute(t.delete())


def main() -> None:
    db = SessionLocal()
    try:
        truncate_application_tables(db)
        db.commit()
        print("Truncated application tables (alembic_version preserved).")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
