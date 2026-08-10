"""Print safe DB target info (host + migration head + key tables). No credentials."""

from __future__ import annotations

import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from sqlalchemy import text

from app.core.config import settings
from app.core.db_url import database_host_label
from app.core.database import engine


def main() -> None:
    host = database_host_label(settings.DATABASE_URL)
    print(f"database_host={host}")
    with engine.connect() as conn:
        version = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
        has_upr = conn.execute(
            text(
                "SELECT EXISTS ("
                "SELECT 1 FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'user_platform_roles'"
                ")"
            )
        ).scalar()
    print(f"alembic_version={version}")
    print(f"user_platform_roles_table={bool(has_upr)}")


if __name__ == "__main__":
    main()
