from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.member_roles.schemas import MemberRoleCreate, MemberRoleListResponse, MemberRoleRead
from app.modules.member_roles.service import MemberRolesService
from app.modules.auth.security_onboarding import require_security_onboarding

router = APIRouter(prefix="/api/v1/member-roles", tags=["member-roles"])


def get_service(db: Session = Depends(get_db)) -> MemberRolesService:
    return MemberRolesService(db)


def _to_read(mr) -> MemberRoleRead:
    return MemberRoleRead(
        id=mr.id,
        organization_member_id=mr.organization_member_id,
        role_id=mr.role_id,
        assigned_by_user_id=mr.assigned_by_user_id,
        assigned_by_user_uuid=mr.assigned_by_user.uuid,
        created_at=mr.created_at,
    )


@router.post("", response_model=MemberRoleRead, status_code=status.HTTP_201_CREATED)
def create_member_role(payload: MemberRoleCreate, svc: MemberRolesService = Depends(get_service)):
    return _to_read(svc.create(payload))


@router.get("", response_model=MemberRoleListResponse)
def list_member_roles(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    organization_member_id: int | None = Query(default=None, ge=1),
    role_id: int | None = Query(default=None, ge=1),
    svc: MemberRolesService = Depends(get_service),
):
    items, total = svc.list(
        limit=limit,
        offset=offset,
        organization_member_id=organization_member_id,
        role_id=role_id,
    )
    return MemberRoleListResponse(items=[_to_read(i) for i in items], limit=limit, offset=offset, total=total)


@router.get("/{member_role_id}", response_model=MemberRoleRead)
def get_member_role(member_role_id: int, svc: MemberRolesService = Depends(get_service)):
    return _to_read(svc.get(member_role_id))


@router.delete("/{member_role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member_role(member_role_id: int, svc: MemberRolesService = Depends(get_service)):
    svc.delete(member_role_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


