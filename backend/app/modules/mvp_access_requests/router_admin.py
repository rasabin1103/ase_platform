from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import AccessRequestStatus
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, require_permission
from app.modules.mvp_access_requests.schemas import (
    AdminAccessRequestListResponse,
    AdminAccessRequestRead,
    AdminAccessRequestReview,
)
from app.modules.mvp_access_requests.service import MvpAccessRequestsService

router = APIRouter(prefix="/api/v1/admin/access-requests", tags=["admin-access-requests"])


def get_service(db: Session = Depends(get_db)) -> MvpAccessRequestsService:
    return MvpAccessRequestsService(db)


@router.get(
    "",
    response_model=AdminAccessRequestListResponse,
    dependencies=[Depends(require_permission("requests.read"))],
)
def list_admin_access_requests(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    status_filter: AccessRequestStatus | None = Query(None, alias="status"),
    svc: MvpAccessRequestsService = Depends(get_service),
) -> AdminAccessRequestListResponse:
    return svc.list_all_admin(limit=limit, offset=offset, status_filter=status_filter)


@router.patch(
    "/{request_id}/review",
    response_model=AdminAccessRequestRead,
    dependencies=[Depends(require_permission("requests.approve"))],
)
def review_access_request(
    request_id: int,
    payload: AdminAccessRequestReview,
    reviewer: User = Depends(get_current_user),
    svc: MvpAccessRequestsService = Depends(get_service),
) -> AdminAccessRequestRead:
    return svc.review(request_id=request_id, reviewer=reviewer, payload=payload)
