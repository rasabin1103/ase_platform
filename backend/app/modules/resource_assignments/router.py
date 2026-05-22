from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import (
    get_current_user,
    is_super_admin,
    require_permission,
    require_tenant_context,
)
from app.modules.auth.security_onboarding import require_security_onboarding
from app.modules.resource_assignments.schemas import (
    ResourceAssignmentCreate,
    ResourceAssignmentListResponse,
    ResourceAssignmentRead,
    ResourceAssignmentUpdate,
)
from app.modules.resource_assignments.service import ResourceAssignmentsService

router = APIRouter(prefix="/api/v1/resource-assignments", tags=["resource-assignments"])


def get_service(db: Session = Depends(get_db)) -> ResourceAssignmentsService:
    return ResourceAssignmentsService(db)


@router.post(
    "",
    response_model=ResourceAssignmentRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("resources.assign")), Depends(require_security_onboarding)],
)
def create_resource_assignment(
    payload: ResourceAssignmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: ResourceAssignmentsService = Depends(get_service),
):
    org = require_tenant_context(request, db, current_user)
    if payload.organization_id is None:
        payload = payload.model_copy(update={"organization_id": org.id})
    elif not is_super_admin(db, current_user) and payload.organization_id != org.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cross-tenant access denied")
    return svc.create(payload, assigned_by_user_id=current_user.id)


@router.get(
    "",
    response_model=ResourceAssignmentListResponse,
    dependencies=[Depends(require_permission("resources.read"))],
)
def list_resource_assignments(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    assigned_to_user_id: int | None = None,
    resource_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: ResourceAssignmentsService = Depends(get_service),
):
    org = require_tenant_context(request, db, current_user)
    organization_id = None if is_super_admin(db, current_user) and request.query_params.get("all_tenants") else org.id
    items, total = svc.list(
        limit=limit,
        offset=offset,
        organization_id=organization_id,
        assigned_to_user_id=assigned_to_user_id,
        resource_type=resource_type,
    )
    return ResourceAssignmentListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get(
    "/{assignment_id}",
    response_model=ResourceAssignmentRead,
    dependencies=[Depends(require_permission("resources.read"))],
)
def get_resource_assignment(
    assignment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: ResourceAssignmentsService = Depends(get_service),
):
    item = svc.get(assignment_id)
    if not is_super_admin(db, current_user):
        org = require_tenant_context(request, db, current_user)
        if item.organization_id is not None and item.organization_id != org.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return item


@router.patch(
    "/{assignment_id}",
    response_model=ResourceAssignmentRead,
    dependencies=[Depends(require_permission("resources.assign")), Depends(require_security_onboarding)],
)
def update_resource_assignment(
    assignment_id: int,
    payload: ResourceAssignmentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: ResourceAssignmentsService = Depends(get_service),
):
    item = svc.get(assignment_id)
    if not is_super_admin(db, current_user):
        org = require_tenant_context(request, db, current_user)
        if item.organization_id is not None and item.organization_id != org.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return svc.update(assignment_id, payload)

