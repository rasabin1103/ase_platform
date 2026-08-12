from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.error_log import ErrorLog


class ErrorLogsRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(
        self,
        *,
        limit: int,
        offset: int,
        error_type: str | None = None,
        path: str | None = None,
        method: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[ErrorLog], int]:
        base = select(ErrorLog)
        if error_type is not None:
            base = base.where(ErrorLog.error_type == error_type)
        if path is not None:
            base = base.where(ErrorLog.path.ilike(f"%{path}%"))
        if method is not None:
            base = base.where(ErrorLog.method == method.upper())
        if date_from is not None:
            base = base.where(ErrorLog.occurred_at >= date_from)
        if date_to is not None:
            base = base.where(ErrorLog.occurred_at <= date_to)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = (
            base.options(selectinload(ErrorLog.user))
            .order_by(ErrorLog.occurred_at.desc(), ErrorLog.id.desc())
            .limit(limit)
            .offset(offset)
        )
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def summary(self) -> tuple[int, int]:
        now = datetime.now(timezone.utc)
        since_24h = now - timedelta(hours=24)
        since_7d = now - timedelta(days=7)
        last_24h = int(
            self.db.execute(
                select(func.count()).select_from(ErrorLog).where(ErrorLog.occurred_at >= since_24h)
            ).scalar_one()
        )
        last_7d = int(
            self.db.execute(
                select(func.count()).select_from(ErrorLog).where(ErrorLog.occurred_at >= since_7d)
            ).scalar_one()
        )
        return last_24h, last_7d
