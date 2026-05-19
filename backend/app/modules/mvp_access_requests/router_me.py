from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import AccessRequestStatus
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, require_permission
from app.modules.mvp_access_requests.schemas import (
    MeAccessRequestCreate,
    MeAccessRequestListResponse,
    MeAccessRequestRead,
)
from app.modules.mvp_access_requests.service import MvpAccessRequestsService

router = APIRouter(prefix="/api/v1/me/access-requests", tags=["me-access-requests"])


def get_service(db: Session = Depends(get_db)) -> MvpAccessRequestsService:
    return MvpAccessRequestsService(db)


@router.post(
    "",
    response_model=MeAccessRequestRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("requests.create"))],
)
def create_my_access_request(
    payload: MeAccessRequestCreate,
    user: User = Depends(get_current_user),
    svc: MvpAccessRequestsService = Depends(get_service),
) -> MeAccessRequestRead:
    return svc.create_for_user(user=user, payload=payload)


@router.get(
    "",
    response_model=MeAccessRequestListResponse,
    dependencies=[Depends(require_permission("requests.read_own"))],
)
def list_my_access_requests(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status_filter: AccessRequestStatus | None = Query(None, alias="status"),
    user: User = Depends(get_current_user),
    svc: MvpAccessRequestsService = Depends(get_service),
) -> MeAccessRequestListResponse:
    return svc.list_for_user(
        user_id=user.id,
        limit=limit,
        offset=offset,
        status_filter=status_filter,
    )
