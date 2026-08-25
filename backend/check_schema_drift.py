"""
Read-only diagnostic: compares every SQLAlchemy model's declared columns
against what actually exists in the live database, and reports any
mismatch. Does not modify anything.

Run from backend/, with the venv activated:

    python check_schema_drift.py

(Copy this file into the backend/ folder first, or run it with the full
path — it just needs to be executed with backend/ as the working directory
so .env is picked up, same as any other backend script.)
"""

from sqlalchemy import inspect

from app.core.database import Base, engine
import app.models  # noqa: F401  (registers all model classes on Base.metadata)


def main() -> None:
    inspector = inspect(engine)
    db_tables = set(inspector.get_table_names())

    any_drift = False

    for table in sorted(Base.metadata.tables.values(), key=lambda t: t.name):
        if table.name not in db_tables:
            print(f"[MISSING TABLE] {table.name}")
            any_drift = True
            continue

        db_columns = {col["name"] for col in inspector.get_columns(table.name)}
        model_columns = {col.name for col in table.columns}

        missing_in_db = model_columns - db_columns
        extra_in_db = db_columns - model_columns

        if missing_in_db:
            print(f"[{table.name}] columns in the model but MISSING in the database: {sorted(missing_in_db)}")
            any_drift = True
        if extra_in_db:
            print(f"[{table.name}] columns in the database but not in the model (informational only): {sorted(extra_in_db)}")

    if not any_drift:
        print("No drift found — every model column exists in the database.")


if __name__ == "__main__":
    main()
