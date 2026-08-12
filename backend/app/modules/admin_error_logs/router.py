from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.admin_error_logs.schemas import ErrorLogListResponse, ErrorLogSummary
from app.modules.admin_error_logs.service import ErrorLogsService
from app.modules.auth.dependencies import require_permission

router = APIRouter(prefix="/api/v1/admin/error-logs", tags=["admin-error-logs"])


def get_service(db: Session = Depends(get_db)) -> ErrorLogsService:
    return ErrorLogsService(db)


@router.get("", response_model=ErrorLogListResponse, dependencies=[Depends(require_permission("platform.read"))])
def list_error_logs(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    error_type: str | None = None,
    path: str | None = None,
    method: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    svc: ErrorLogsService = Depends(get_service),
):
    items, total = svc.list(
        limit=limit,
        offset=offset,
        error_type=error_type,
        path=path,
        method=method,
        date_from=date_from,
        date_to=date_to,
    )
    return ErrorLogListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get(
    "/summary", response_model=ErrorLogSummary, dependencies=[Depends(require_permission("platform.read"))],
)
def error_logs_summary(svc: ErrorLogsService = Depends(get_service)):
    last_24h, last_7d = svc.summary()
    return ErrorLogSummary(last_24h=last_24h, last_7d=last_7d)
