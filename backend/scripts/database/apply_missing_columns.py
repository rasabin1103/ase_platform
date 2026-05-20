"""Add columns present in Alembic but missing from partial Supabase SQL setup."""
from __future__ import annotations

import _bootstrap  # noqa: F401

from sqlalchemy import inspect, text

from app.core.database import engine


def _has_column(table: str, column: str) -> bool:
    insp = inspect(engine)
    return any(c["name"] == column for c in insp.get_columns(table))


def main() -> None:
    alters: list[str] = []

    if not _has_column("users", "avatar_url"):
        alters.append("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(2048)")
    if not _has_column("users", "avatar_data"):
        alters.append("ALTER TABLE users ADD COLUMN avatar_data BYTEA")
    if not _has_column("users", "avatar_mime"):
        alters.append("ALTER TABLE users ADD COLUMN avatar_mime VARCHAR(100)")
    if not _has_column("users", "phone_e164"):
        alters.append("ALTER TABLE users ADD COLUMN phone_e164 VARCHAR(20)")
    if not _has_column("users", "phone_verified_at"):
        alters.append("ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMPTZ")
    if not _has_column("users", "two_factor_enabled"):
        alters.append(
            "ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN NOT NULL DEFAULT false"
        )
    if not _has_column("catalog_items", "image_data"):
        alters.append("ALTER TABLE catalog_items ADD COLUMN image_data BYTEA")
    if not _has_column("catalog_items", "image_mime"):
        alters.append("ALTER TABLE catalog_items ADD COLUMN image_mime VARCHAR(64)")

    if not alters:
        print("No missing user columns.")
        return

    with engine.begin() as conn:
        for stmt in alters:
            print("Running:", stmt)
            conn.execute(text(stmt))
        # unique index on phone if column was just added
        if any("phone_e164" in s for s in alters):
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_phone_e164 ON users (phone_e164)"
                )
            )

    print(f"Applied {len(alters)} column change(s).")


if __name__ == "__main__":
    main()
