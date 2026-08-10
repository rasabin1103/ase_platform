"""DESTRUCTIVE: drops and recreates the public schema, wiping every table
(including alembic_version), so 'alembic upgrade head' can rebuild the
schema from scratch and match the current models exactly.

Run with: python -m scripts.reset_db
Requires typing RESET to confirm.
"""
from __future__ import annotations

import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from sqlalchemy import text

from app.core.database import engine

url = str(engine.url)
# hide password in echoed url
if engine.url.password:
    url = url.replace(engine.url.password, "***")

print(f"Target database: {url}")
print("This will DROP the entire 'public' schema (all tables, all data) and recreate it empty.")
confirm = input("Type RESET to continue: ")
if confirm.strip() != "RESET":
    print("Aborted.")
    sys.exit(1)

with engine.begin() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE"))
    conn.execute(text("CREATE SCHEMA public"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO public"))

print("Schema reset complete. Now run:")
print("  alembic upgrade head")
print("  python -m scripts.seed_initial_data")
