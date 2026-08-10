from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, is_platform_admin, require_permission, require_tenant_context
from app.modules.users.schemas import UserCreate, UserListResponse, UserRead, UserUpdate
from app.modules.users.service import UsersService

router = APIRouter(prefix="/api/v1/users", tags=["users"])


def get_users_service(db: Session = Depends(get_db)) -> UsersService:
    return UsersService(db)


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("users.create"))],
)
def create_user(payload: UserCreate, svc: UsersService = Depends(get_users_service)):
    user = svc.create_user(payload)
    return user


@router.get("", response_model=UserListResponse, dependencies=[Depends(require_permission("users.read"))])
def list_users(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: UsersService = Depends(get_users_service),
):
    if is_platform_admin(db, current_user):
        items, total = svc.list_users(limit=limit, offset=offset)
    else:
        org = require_tenant_context(request, db, current_user)
        items, total = svc.list_users_for_organization(organization_id=org.id, limit=limit, offset=offset)
    return UserListResponse(items=items, limit=limit, offset=offset, total=total)


@router.get("/{user_uuid}", response_model=UserRead, dependencies=[Depends(require_permission("users.read"))])
def get_user(
    user_uuid: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: UsersService = Depends(get_users_service),
):
    if is_platform_admin(db, current_user):
        return svc.get_user(user_uuid)
    org = require_tenant_context(request, db, current_user)
    return svc.get_user_for_organization(user_uuid, organization_id=org.id)


@router.patch("/{user_uuid}", response_model=UserRead, dependencies=[Depends(require_permission("users.update"))])
def update_user(
    user_uuid: UUID,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: UsersService = Depends(get_users_service),
):
    if not is_platform_admin(db, current_user):
        org = require_tenant_context(request, db, current_user)
        svc.get_user_for_organization(user_uuid, organization_id=org.id)
    return svc.update_user(user_uuid, payload)


@router.delete("/{user_uuid}", response_model=UserRead, dependencies=[Depends(require_permission("users.delete"))])
def delete_user(
    user_uuid: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: UsersService = Depends(get_users_service),
):
    if not is_platform_admin(db, current_user):
        org = require_tenant_context(request, db, current_user)
        svc.get_user_for_organization(user_uuid, organization_id=org.id)
    return svc.soft_delete_user(user_uuid)

