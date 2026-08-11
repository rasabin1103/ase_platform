from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.database import get_db
from app.models.enums import UserStatus
from app.models.user import User
from app.modules.auth.dependencies import (
    get_current_user,
    is_platform_admin,
    is_super_admin,
    require_permission,
    require_platform_role,
    require_tenant_context,
)
from app.modules.auth.security import create_impersonation_token, IMPERSONATION_TOKEN_MINUTES
from app.modules.users.repository import UsersRepository
from app.modules.users.schemas import ImpersonationTokenRead, UserCreate, UserListResponse, UserRead, UserUpdate
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
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: UsersService = Depends(get_users_service),
):
    user = svc.create_user(payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="user.create",
        entity_type="user",
        entity_id=str(user.id),
        metadata={"email": user.email},
    )
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
    updated = svc.update_user(user_uuid, payload)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="user.update",
        entity_type="user",
        entity_id=str(updated.id),
        metadata={"fields": sorted(payload.model_dump(exclude_unset=True).keys())},
    )
    return updated


@router.post(
    "/{user_uuid}/impersonate",
    response_model=ImpersonationTokenRead,
    dependencies=[Depends(require_platform_role("super_admin"))],
)
def impersonate_user(
    user_uuid: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Support tool: mint a short-lived (30 min, non-renewable) access token
    for `user_uuid` so a super admin can see the product exactly as that user
    does. Restricted to the super_admin platform role — never granted via the
    generic `users.*` permissions org_owner/org_admin may hold."""
    target = UsersRepository(db).get_by_uuid(user_uuid)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if target.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot impersonate yourself")
    if is_super_admin(db, target):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot impersonate another super admin")
    if target.status in (UserStatus.suspended, UserStatus.deleted):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot impersonate a suspended or deleted user")

    token = create_impersonation_token(target_user_uuid=target.uuid, actor_user_uuid=current_user.uuid)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="user.impersonate_start",
        entity_type="user",
        entity_id=str(target.id),
        metadata={"target_email": target.email},
    )
    return ImpersonationTokenRead(
        access_token=token, expires_in_minutes=IMPERSONATION_TOKEN_MINUTES, target_email=target.email,
    )


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
    deleted = svc.soft_delete_user(user_uuid)
    record_audit_log(
        db,
        actor_user_id=current_user.id,
        action="user.delete",
        entity_type="user",
        entity_id=str(deleted.id),
        metadata={"email": deleted.email},
    )
    return deleted

