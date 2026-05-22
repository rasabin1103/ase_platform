from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import expand_permission_codes
from app.models.enums import AccessRequestStatus
from app.models.user import User
from app.modules.access_requests.schemas import (
    AccessRequestCreate,
    AccessRequestListResponse,
    AccessRequestRead,
    AccessRequestUpdate,
    CreatorApplicationCreate,
)
from app.modules.access_requests.service import AccessRequestsService
from app.modules.auth.dependencies import (
    get_current_user,
    is_super_admin,
    require_permission,
    require_tenant_context,
    user_has_any_permission,
)
from app.modules.auth.security_onboarding import require_security_onboarding

router = APIRouter(prefix="/api/v1/access-requests", tags=["access-requests"])


def get_service(db: Session = Depends(get_db)) -> AccessRequestsService:
    return AccessRequestsService(db)


@router.post(
    "/creator-application",
    response_model=AccessRequestRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("creator.request")), Depends(require_security_onboarding)],
)
def create_creator_application(
    payload: CreatorApplicationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: AccessRequestsService = Depends(get_service),
):
    org = require_tenant_context(request, db, current_user)
    return svc.create_creator_application(
        payload,
        requested_by_user_id=current_user.id,
        organization_id=org.id,
    )


@router.post(
    "",
    response_model=AccessRequestRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("requests.create")), Depends(require_security_onboarding)],
)
def create_access_request(
    payload: AccessRequestCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: AccessRequestsService = Depends(get_service),
):
    org = require_tenant_context(request, db, current_user)
    if payload.organization_id is None:
        payload = payload.model_copy(update={"organization_id": org.id})
    elif not is_super_admin(db, current_user) and payload.organization_id != org.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access denied")
    return svc.create(payload, requested_by_user_id=current_user.id)


@router.get("", response_model=AccessRequestListResponse)
def list_access_requests(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    status_filter: AccessRequestStatus | None = Query(default=None, alias="status"),
    creator_only: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: AccessRequestsService = Depends(get_service),
):
    org = require_tenant_context(request, db, current_user)
    can_read_all = is_super_admin(db, current_user) or user_has_any_permission(
        db,
        user_id=current_user.id,
        organization_id=org.id,
        permission_codes=expand_permission_codes("requests.read"),
    )
    can_read_own = user_has_any_permission(
        db,
        user_id=current_user.id,
        organization_id=org.id,
        permission_codes=expand_permission_codes("requests.read_own"),
    )
    if not can_read_all and not can_read_own:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing permission")

    organization_id = None
    requested_by_user_id = None
    if is_super_admin(db, current_user) and request.query_params.get("all_tenants"):
        organization_id = None
    elif can_read_all:
        organization_id = org.id
    else:
        organization_id = org.id
        requested_by_user_id = current_user.id

    items, total = svc.list(
        limit=limit,
        offset=offset,
        organization_id=organization_id,
        requested_by_user_id=requested_by_user_id,
        status=status_filter,
        creator_only=creator_only,
    )
    return AccessRequestListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get("/{request_id}", response_model=AccessRequestRead)
def get_access_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: AccessRequestsService = Depends(get_service),
):
    item = svc.get(request_id)
    org = require_tenant_context(request, db, current_user)
    if is_super_admin(db, current_user):
        return item
    if item.requested_by_user_id == current_user.id and user_has_any_permission(
        db,
        user_id=current_user.id,
        organization_id=org.id,
        permission_codes=expand_permission_codes("requests.read_own"),
    ):
        return item
    if user_has_any_permission(
        db,
        user_id=current_user.id,
        organization_id=org.id,
        permission_codes=expand_permission_codes("requests.read"),
    ):
        if item.organization_id is None or item.organization_id == org.id:
            return item
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")


@router.patch(
    "/{request_id}",
    response_model=AccessRequestRead,
    dependencies=[Depends(require_permission("requests.manage"))],
)
def update_access_request(
    request_id: int,
    payload: AccessRequestUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: AccessRequestsService = Depends(get_service),
):
    item = svc.get(request_id)
    if not is_super_admin(db, current_user):
        org = require_tenant_context(request, db, current_user)
        if item.organization_id is not None and item.organization_id != org.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return svc.update(request_id, payload)


@router.post("/{request_id}/approve", response_model=AccessRequestRead)
def approve_access_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: AccessRequestsService = Depends(get_service),
):
    item = svc.get(request_id)
    org = require_tenant_context(request, db, current_user)
    can_approve = is_super_admin(db, current_user) or user_has_any_permission(
        db,
        user_id=current_user.id,
        organization_id=org.id,
        permission_codes=expand_permission_codes("creator.approve"),
    ) or user_has_any_permission(
        db,
        user_id=current_user.id,
        organization_id=org.id,
        permission_codes=expand_permission_codes("requests.approve"),
    )
    if not can_approve:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing permission")
    if not is_super_admin(db, current_user) and item.organization_id is not None and item.organization_id != org.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return svc.approve(request_id, reviewer_id=current_user.id)


@router.post("/{request_id}/reject", response_model=AccessRequestRead)
def reject_access_request(
    request_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: AccessRequestsService = Depends(get_service),
):
    item = svc.get(request_id)
    org = require_tenant_context(request, db, current_user)
    can_reject = is_super_admin(db, current_user) or user_has_any_permission(
        db,
        user_id=current_user.id,
        organization_id=org.id,
        permission_codes=expand_permission_codes("creator.approve"),
    ) or user_has_any_permission(
        db,
        user_id=current_user.id,
        organization_id=org.id,
        permission_codes=expand_permission_codes("requests.approve"),
    )
    if not can_reject:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing permission")
    if not is_super_admin(db, current_user) and item.organization_id is not None and item.organization_id != org.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    return svc.reject(request_id, reviewer_id=current_user.id)

