from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import UserStatus
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, is_super_admin
from app.modules.admin_users.schemas import (
    AdminUserCreate,
    AdminUserListResponse,
    AdminUserRead,
    AdminUserStatusPatch,
    AdminUserUpdate,
)
from app.modules.admin_users.service import AdminUsersService

router = APIRouter(prefix="/api/v1/admin/users", tags=["admin-users"])


def require_super_admin(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> User:
    if not is_super_admin(db, user):
        from fastapi import HTTPException

        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")
    return user


def get_service(db: Session = Depends(get_db)) -> AdminUsersService:
    return AdminUsersService(db)


@router.get("", response_model=AdminUserListResponse)
def list_admin_users(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    status_filter: UserStatus | None = Query(default=None, alias="status"),
    role: str | None = Query(default=None),
    search: str | None = Query(default=None),
    _actor: User = Depends(require_super_admin),
    svc: AdminUsersService = Depends(get_service),
):
    return svc.list_users(limit=limit, offset=offset, status=status_filter, role=role, search=search)


@router.post("", response_model=AdminUserRead, status_code=status.HTTP_201_CREATED)
def create_admin_user(
    payload: AdminUserCreate,
    actor: User = Depends(require_super_admin),
    svc: AdminUsersService = Depends(get_service),
):
    return svc.create_user(payload, actor=actor)


@router.get("/{user_id}", response_model=AdminUserRead)
def get_admin_user(
    user_id: UUID,
    _actor: User = Depends(require_super_admin),
    svc: AdminUsersService = Depends(get_service),
):
    return svc.get_user(user_id)


@router.put("/{user_id}", response_model=AdminUserRead)
def update_admin_user(
    user_id: UUID,
    payload: AdminUserUpdate,
    actor: User = Depends(require_super_admin),
    svc: AdminUsersService = Depends(get_service),
):
    return svc.update_user(user_id, payload, actor=actor)


@router.patch("/{user_id}/status", response_model=AdminUserRead)
def patch_admin_user_status(
    user_id: UUID,
    payload: AdminUserStatusPatch,
    actor: User = Depends(require_super_admin),
    svc: AdminUsersService = Depends(get_service),
):
    return svc.patch_status(user_id, payload, actor=actor)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin_user(
    user_id: UUID,
    actor: User = Depends(require_super_admin),
    svc: AdminUsersService = Depends(get_service),
):
    svc.hard_delete_user(user_id, actor=actor)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
