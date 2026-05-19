from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.permissions.schemas import (
    PermissionCreate,
    PermissionListResponse,
    PermissionRead,
    PermissionUpdate,
)
from app.modules.permissions.service import PermissionsService

router = APIRouter(prefix="/api/v1/permissions", tags=["permissions"])


def get_permissions_service(db: Session = Depends(get_db)) -> PermissionsService:
    return PermissionsService(db)


@router.post("", response_model=PermissionRead, status_code=status.HTTP_201_CREATED)
def create_permission(payload: PermissionCreate, svc: PermissionsService = Depends(get_permissions_service)):
    return svc.create(payload)


@router.get("", response_model=PermissionListResponse)
def list_permissions(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    svc: PermissionsService = Depends(get_permissions_service),
):
    items, total = svc.list(limit=limit, offset=offset)
    return PermissionListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get("/{permission_id}", response_model=PermissionRead)
def get_permission(permission_id: int, svc: PermissionsService = Depends(get_permissions_service)):
    return svc.get(permission_id)


@router.patch("/{permission_id}", response_model=PermissionRead)
def update_permission(permission_id: int, payload: PermissionUpdate, svc: PermissionsService = Depends(get_permissions_service)):
    return svc.update(permission_id, payload)


@router.delete("/{permission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_permission(permission_id: int, svc: PermissionsService = Depends(get_permissions_service)):
    svc.delete(permission_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

