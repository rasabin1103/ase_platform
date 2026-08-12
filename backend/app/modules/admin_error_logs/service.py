from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.error_log import ErrorLog
from app.modules.admin_error_logs.repository import ErrorLogsRepository


class ErrorLogsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ErrorLogsRepository(db)

    def list(
        self,
        *,
        limit: int,
        offset: int,
        error_type: str | None,
        path: str | None,
        method: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
    ) -> tuple[list[ErrorLog], int]:
        return self.repo.list(
            limit=limit,
            offset=offset,
            error_type=error_type,
            path=path,
            method=method,
            date_from=date_from,
            date_to=date_to,
        )

    def summary(self) -> tuple[int, int]:
        return self.repo.summary()
