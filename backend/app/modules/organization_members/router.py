from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, is_platform_admin, require_permission, require_tenant_context
from app.modules.organization_members.schemas import (
    OrganizationMemberCreate,
    OrganizationMemberListResponse,
    OrganizationMemberRead,
    OrganizationMemberUpdate,
)
from app.modules.organization_members.service import OrganizationMembersService

router = APIRouter(prefix="/api/v1/organization-members", tags=["organization-members"])


def get_service(db: Session = Depends(get_db)) -> OrganizationMembersService:
    return OrganizationMembersService(db)


@router.post(
    "",
    response_model=OrganizationMemberRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("users.create"))],
)
def create_member(
    payload: OrganizationMemberCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: OrganizationMembersService = Depends(get_service),
):
    if not is_platform_admin(db, current_user):
        org = require_tenant_context(request, db, current_user)
        payload_org_id = svc.repo.get_organization_id(
            organization_id=payload.organization_id,
            organization_uuid=payload.organization_uuid,
        )
        if payload_org_id != org.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organization mismatch")
    m = svc.create(payload)
    return OrganizationMemberRead(
        id=m.id,
        organization_id=m.organization_id,
        user_id=m.user_id,
        organization_uuid=m.organization.uuid,
        user_uuid=m.user.uuid,
        membership_status=m.membership_status,
        joined_at=m.joined_at,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


@router.get("", response_model=OrganizationMemberListResponse, dependencies=[Depends(require_permission("users.read"))])
def list_members(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    organization_id: int | None = Query(default=None, ge=1),
    user_id: int | None = Query(default=None, ge=1),
    organization_uuid: UUID | None = None,
    user_uuid: UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: OrganizationMembersService = Depends(get_service),
):
    if is_platform_admin(db, current_user) and organization_uuid is not None:
        organization_id = svc.repo.get_organization_id(organization_id=None, organization_uuid=organization_uuid)
        if organization_id is None:
            return OrganizationMemberListResponse(items=[], limit=limit, offset=offset, total=0)
    elif not is_platform_admin(db, current_user):
        organization_id = require_tenant_context(request, db, current_user).id
    if user_uuid is not None:
        user_id = svc.repo.get_user_id(user_id=None, user_uuid=user_uuid)
        if user_id is None:
            return OrganizationMemberListResponse(items=[], limit=limit, offset=offset, total=0)
    items, total = svc.list(limit=limit, offset=offset, organization_id=organization_id, user_id=user_id)
    mapped = [
        OrganizationMemberRead(
            id=m.id,
            organization_id=m.organization_id,
            user_id=m.user_id,
            organization_uuid=m.organization.uuid,
            user_uuid=m.user.uuid,
            membership_status=m.membership_status,
            joined_at=m.joined_at,
            created_at=m.created_at,
            updated_at=m.updated_at,
        )
        for m in items
    ]
    return OrganizationMemberListResponse(items=mapped, limit=limit, offset=offset, total=total)


@router.get("/{member_id}", response_model=OrganizationMemberRead, dependencies=[Depends(require_permission("users.read"))])
def get_member(
    member_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: OrganizationMembersService = Depends(get_service),
):
    m = svc.get(member_id)
    if not is_platform_admin(db, current_user) and m.organization_id != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization member not found")
    return OrganizationMemberRead(
        id=m.id,
        organization_id=m.organization_id,
        user_id=m.user_id,
        organization_uuid=m.organization.uuid,
        user_uuid=m.user.uuid,
        membership_status=m.membership_status,
        joined_at=m.joined_at,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


@router.patch("/{member_id}", response_model=OrganizationMemberRead, dependencies=[Depends(require_permission("users.update"))])
def update_member(
    member_id: int,
    payload: OrganizationMemberUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: OrganizationMembersService = Depends(get_service),
):
    existing = svc.get(member_id)
    if not is_platform_admin(db, current_user) and existing.organization_id != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization member not found")
    m = svc.update(member_id, payload)
    return OrganizationMemberRead(
        id=m.id,
        organization_id=m.organization_id,
        user_id=m.user_id,
        organization_uuid=m.organization.uuid,
        user_uuid=m.user.uuid,
        membership_status=m.membership_status,
        joined_at=m.joined_at,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


@router.delete("/{member_id}", response_model=OrganizationMemberRead, dependencies=[Depends(require_permission("users.delete"))])
def delete_member(
    member_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: OrganizationMembersService = Depends(get_service),
):
    existing = svc.get(member_id)
    if not is_platform_admin(db, current_user) and existing.organization_id != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization member not found")
    m = svc.suspend(member_id)
    return OrganizationMemberRead(
        id=m.id,
        organization_id=m.organization_id,
        user_id=m.user_id,
        organization_uuid=m.organization.uuid,
        user_uuid=m.user.uuid,
        membership_status=m.membership_status,
        joined_at=m.joined_at,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )

