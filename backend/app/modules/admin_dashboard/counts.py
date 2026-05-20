"""Dashboard counts safe when PostgreSQL enum lags behind app models."""

from __future__ import annotations

from sqlalchemy import String, cast, func, select
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.models.enums import UserStatus
from app.models.user import User


def user_status_is_not_deleted() -> ColumnElement[bool]:
    return cast(User.status, String) != UserStatus.deleted.value


def count_users_inactive_or_suspended(db: Session) -> int:
    """Compare as text so missing enum value `inactive` in DB does not break stats."""
    return int(
        db.execute(
            select(func.count())
            .select_from(User)
            .where(cast(User.status, String).in_(("inactive", "suspended")))
        ).scalar_one()
    )


def count_users_excluding_deleted(db: Session) -> int:
    return int(
        db.execute(select(func.count()).select_from(User).where(user_status_is_not_deleted())).scalar_one()
    )
