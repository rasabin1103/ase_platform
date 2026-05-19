from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, is_platform_admin, require_permission, require_tenant_context
from app.modules.audit_logs.schemas import AuditLogCreate, AuditLogListResponse, AuditLogRead
from app.modules.audit_logs.service import AuditLogsService

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit-logs"])


def get_service(db: Session = Depends(get_db)) -> AuditLogsService:
    return AuditLogsService(db)


@router.post("", response_model=AuditLogRead, status_code=status.HTTP_201_CREATED)
def create_audit_log(payload: AuditLogCreate, svc: AuditLogsService = Depends(get_service)):
    return svc.create(payload)


@router.get("", response_model=AuditLogListResponse, dependencies=[Depends(require_permission("audit.read"))])
def list_audit_logs(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    organization_id: int | None = Query(default=None, ge=1),
    organization_uuid: UUID | None = None,
    actor_user_id: int | None = Query(default=None, ge=1),
    actor_user_uuid: UUID | None = None,
    entity_type: str | None = None,
    action: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: AuditLogsService = Depends(get_service),
):
    if is_platform_admin(db, current_user) and organization_uuid is not None:
        organization_id = svc.repo.get_organization_id(organization_id=None, organization_uuid=organization_uuid)
        if organization_id is None:
            return AuditLogListResponse(items=[], limit=limit, offset=offset, total=0)
    elif not is_platform_admin(db, current_user):
        organization_id = require_tenant_context(request, db, current_user).id
    if actor_user_uuid is not None:
        actor_user_id = svc.repo.get_user_id(user_id=None, user_uuid=actor_user_uuid)
        if actor_user_id is None:
            return AuditLogListResponse(items=[], limit=limit, offset=offset, total=0)

    items, total = svc.list(
        limit=limit,
        offset=offset,
        organization_id=organization_id,
        actor_user_id=actor_user_id,
        entity_type=entity_type,
        action=action,
        date_from=date_from,
        date_to=date_to,
    )
    return AuditLogListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get(
    "/{audit_log_id}",
    response_model=AuditLogRead,
    dependencies=[Depends(require_permission("audit.read"))],
)
def get_audit_log(
    audit_log_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: AuditLogsService = Depends(get_service),
):
    item = svc.get(audit_log_id)
    if not is_platform_admin(db, current_user) and item.organization_id != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit log not found")
    return item

