from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.role_permissions.schemas import RolePermissionCreate, RolePermissionListResponse, RolePermissionRead
from app.modules.role_permissions.service import RolePermissionsService
from app.modules.auth.security_onboarding import require_security_onboarding

router = APIRouter(prefix="/api/v1/role-permissions", tags=["role-permissions"])


def get_service(db: Session = Depends(get_db)) -> RolePermissionsService:
    return RolePermissionsService(db)


@router.post("", response_model=RolePermissionRead, status_code=status.HTTP_201_CREATED)
def create_role_permission(payload: RolePermissionCreate, svc: RolePermissionsService = Depends(get_service)):
    return svc.create(payload)


@router.get("", response_model=RolePermissionListResponse)
def list_role_permissions(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    role_id: int | None = Query(default=None, ge=1),
    permission_id: int | None = Query(default=None, ge=1),
    svc: RolePermissionsService = Depends(get_service),
):
    items, total = svc.list(limit=limit, offset=offset, role_id=role_id, permission_id=permission_id)
    return RolePermissionListResponse(
        items=[RolePermissionRead.model_validate(i) for i in items],
        limit=limit,
        offset=offset,
        total=total,
    )


@router.get("/{role_permission_id}", response_model=RolePermissionRead)
def get_role_permission(role_permission_id: int, svc: RolePermissionsService = Depends(get_service)):
    return svc.get(role_permission_id)


@router.delete("/{role_permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role_permission(role_permission_id: int, svc: RolePermissionsService = Depends(get_service)):
    svc.delete(role_permission_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


