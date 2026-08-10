from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.roles.schemas import RoleCreate, RoleListResponse, RoleRead, RoleUpdate
from app.modules.roles.service import RolesService

router = APIRouter(prefix="/api/v1/roles", tags=["roles"])


def get_roles_service(db: Session = Depends(get_db)) -> RolesService:
    return RolesService(db)


@router.post("", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(payload: RoleCreate, svc: RolesService = Depends(get_roles_service)):
    return svc.create(payload)


@router.get("", response_model=RoleListResponse)
def list_roles(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    svc: RolesService = Depends(get_roles_service),
):
    items, total = svc.list(limit=limit, offset=offset)
    return RoleListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get("/{role_id}", response_model=RoleRead)
def get_role(role_id: int, svc: RolesService = Depends(get_roles_service)):
    return svc.get(role_id)


@router.patch("/{role_id}", response_model=RoleRead)
def update_role(role_id: int, payload: RoleUpdate, svc: RolesService = Depends(get_roles_service)):
    return svc.update(role_id, payload)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: int, svc: RolesService = Depends(get_roles_service)):
    svc.delete(role_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

