"""Helpers for optional / versioned schema (tables not present in every deployment)."""

from __future__ import annotations

from sqlalchemy import inspect
from sqlalchemy.orm import Session


def table_exists(db: Session, table_name: str) -> bool:
    bind = db.get_bind()
    return inspect(bind).has_table(table_name)
