from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import MembershipStatus
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, require_permission, user_has_role_assigned
from app.modules.organizations.schemas import (
    OrganizationCreate,
    OrganizationListResponse,
    OrganizationRead,
    OrganizationUpdate,
)
from app.modules.organizations.service import OrganizationsService

router = APIRouter(prefix="/api/v1/organizations", tags=["organizations"])


def get_organizations_service(db: Session = Depends(get_db)) -> OrganizationsService:
    return OrganizationsService(db)


def _current_user_relationship(db: Session, *, org_id: int, user_id: int) -> tuple[MembershipStatus | None, list[str]]:
    member = db.execute(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user_id,
        )
    ).scalar_one_or_none()
    if member is None:
        return None, []

    role_codes = list(
        db.execute(
            select(Role.code)
            .join(MemberRole, MemberRole.role_id == Role.id)
            .where(MemberRole.organization_member_id == member.id)
            .order_by(Role.code.asc())
        ).scalars().all()
    )
    return member.membership_status, role_codes


def _to_read(org: Organization, *, db: Session, current_user_id: int) -> OrganizationRead:
    membership_status, role_codes = _current_user_relationship(db, org_id=org.id, user_id=current_user_id)
    return OrganizationRead(
        uuid=org.uuid,
        name=org.name,
        slug=org.slug,
        type=org.type,
        status=org.status,
        owner_user_uuid=org.owner.uuid,
        current_user_membership_status=membership_status,
        current_user_role_codes=role_codes,
        created_at=org.created_at,
        updated_at=org.updated_at,
    )


@router.post(
    "",
    response_model=OrganizationRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("organizations.create"))],
)
def create_organization(
    payload: OrganizationCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    svc: OrganizationsService = Depends(get_organizations_service),
):
    return _to_read(svc.create(payload), db=db, current_user_id=user.id)


@router.get("", response_model=OrganizationListResponse)
def list_organizations(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    svc: OrganizationsService = Depends(get_organizations_service),
):
    is_super_admin = user_has_role_assigned(db, user_id=user.id, role_code="super_admin")
    if is_super_admin:
        items, total = svc.list(limit=limit, offset=offset, include_suspended=True)
    else:
        items, total = svc.list_for_user(user_id=user.id, limit=limit, offset=offset)
    return OrganizationListResponse(
        items=[_to_read(o, db=db, current_user_id=user.id) for o in items],
        limit=limit,
        offset=offset,
        total=total,
    )


@router.get(
    "/{organization_uuid}",
    response_model=OrganizationRead,
    dependencies=[Depends(require_permission("organizations.read"))],
)
def get_organization(
    organization_uuid: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    svc: OrganizationsService = Depends(get_organizations_service),
):
    return _to_read(svc.get(organization_uuid), db=db, current_user_id=user.id)


@router.patch(
    "/{organization_uuid}",
    response_model=OrganizationRead,
    dependencies=[Depends(require_permission("organizations.update"))],
)
def update_organization(
    organization_uuid: UUID,
    payload: OrganizationUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    svc: OrganizationsService = Depends(get_organizations_service),
):
    return _to_read(svc.update(organization_uuid, payload), db=db, current_user_id=user.id)


@router.delete(
    "/{organization_uuid}",
    response_model=OrganizationRead,
    dependencies=[Depends(require_permission("organizations.delete"))],
)
def delete_organization(
    organization_uuid: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    svc: OrganizationsService = Depends(get_organizations_service),
):
    return _to_read(svc.soft_delete(organization_uuid), db=db, current_user_id=user.id)

