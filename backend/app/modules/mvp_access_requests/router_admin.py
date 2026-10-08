from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.database import get_db
from app.models.enums import AccessRequestStatus
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, is_super_admin, require_permission
from app.modules.mvp_access_requests.schemas import (
    AdminAccessRequestListResponse,
    AdminAccessRequestRead,
    AdminAccessRequestReview,
)
from app.modules.mvp_access_requests.service import MvpAccessRequestsService

router = APIRouter(prefix="/api/v1/admin/access-requests", tags=["admin-access-requests"])


def _require_platform_admin(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> None:
    """Estas rutas ven y resuelven solicitudes de todas las organizaciones."""
    if not is_super_admin(db, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Platform admins only")


def get_service(db: Session = Depends(get_db)) -> MvpAccessRequestsService:
    return MvpAccessRequestsService(db)


@router.get(
    "",
    response_model=AdminAccessRequestListResponse,
    # Lista de TODAS las organizaciones: solo el equipo de la plataforma.
    dependencies=[Depends(_require_platform_admin), Depends(require_permission("requests.read"))],
)
def list_admin_access_requests(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    status_filter: AccessRequestStatus | None = Query(None, alias="status"),
    escalated: bool | None = Query(None),
    svc: MvpAccessRequestsService = Depends(get_service),
) -> AdminAccessRequestListResponse:
    return svc.list_all_admin(limit=limit, offset=offset, status_filter=status_filter, escalated=escalated)


@router.patch(
    "/{request_id}/review",
    response_model=AdminAccessRequestRead,
    dependencies=[Depends(_require_platform_admin), Depends(require_permission("requests.approve"))],
)
def review_access_request(
    request_id: int,
    payload: AdminAccessRequestReview,
    db: Session = Depends(get_db),
    reviewer: User = Depends(get_current_user),
    svc: MvpAccessRequestsService = Depends(get_service),
) -> AdminAccessRequestRead:
    result = svc.review(request_id=request_id, reviewer=reviewer, payload=payload)
    record_audit_log(
        db,
        actor_user_id=reviewer.id,
        action=f"access_request.{payload.status}",
        entity_type="access_request",
        entity_id=str(request_id),
        metadata={"title": result.title},
    )
    return result
