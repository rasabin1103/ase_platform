from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import InvitationStatus
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, is_platform_admin, require_permission, require_tenant_context
from app.modules.auth.security_onboarding import require_security_onboarding
from app.modules.invitations.schemas import (
    InvitationCreate,
    InvitationListResponse,
    InvitationRead,
    InvitationUpdate,
)
from app.modules.invitations.service import InvitationsService

router = APIRouter(prefix="/api/v1/invitations", tags=["invitations"])


def get_service(db: Session = Depends(get_db)) -> InvitationsService:
    return InvitationsService(db)


def _to_read(inv) -> InvitationRead:
    return InvitationRead(
        id=inv.id,
        organization_id=inv.organization_id,
        organization_uuid=inv.organization.uuid,
        email=inv.email,
        role_id=inv.role_id,
        token=inv.token,
        status=inv.status,
        expires_at=inv.expires_at,
        invited_by_user_id=inv.invited_by_user_id,
        invited_by_user_uuid=inv.invited_by_user.uuid,
        created_at=inv.created_at,
    )


@router.post(
    "",
    response_model=InvitationRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[
        Depends(require_permission("users.create")),
        Depends(require_security_onboarding),
    ],
)
def create_invitation(
    payload: InvitationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: InvitationsService = Depends(get_service),
):
    if not is_platform_admin(db, current_user):
        org = require_tenant_context(request, db, current_user)
        payload_org_id = svc.repo.get_organization_id(
            organization_id=payload.organization_id,
            organization_uuid=payload.organization_uuid,
        )
        if payload_org_id != org.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Organization mismatch")
    return _to_read(svc.create(payload))


@router.get("", response_model=InvitationListResponse, dependencies=[Depends(require_permission("users.read"))])
def list_invitations(
    request: Request,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    organization_id: int | None = Query(default=None, ge=1),
    organization_uuid: UUID | None = None,
    email: str | None = None,
    status_filter: InvitationStatus | None = Query(default=None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: InvitationsService = Depends(get_service),
):
    if is_platform_admin(db, current_user) and organization_uuid is not None:
        organization_id = svc.repo.get_organization_id(organization_id=None, organization_uuid=organization_uuid)
        if organization_id is None:
            return InvitationListResponse(items=[], limit=limit, offset=offset, total=0)
    elif not is_platform_admin(db, current_user):
        organization_id = require_tenant_context(request, db, current_user).id
    items, total = svc.list(
        limit=limit,
        offset=offset,
        organization_id=organization_id,
        email=email,
        status_filter=status_filter,
    )
    return InvitationListResponse(items=[_to_read(i) for i in items], limit=limit, offset=offset, total=total)


@router.get("/{invitation_id}", response_model=InvitationRead, dependencies=[Depends(require_permission("users.read"))])
def get_invitation(
    invitation_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: InvitationsService = Depends(get_service),
):
    inv = svc.get(invitation_id)
    if not is_platform_admin(db, current_user) and inv.organization_id != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    return _to_read(inv)


@router.patch(
    "/{invitation_id}",
    response_model=InvitationRead,
    dependencies=[
        Depends(require_permission("users.update")),
        Depends(require_security_onboarding),
    ],
)
def update_invitation(
    invitation_id: int,
    payload: InvitationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: InvitationsService = Depends(get_service),
):
    inv = svc.get(invitation_id)
    if not is_platform_admin(db, current_user) and inv.organization_id != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    return _to_read(svc.update(invitation_id, payload))


@router.delete(
    "/{invitation_id}",
    response_model=InvitationRead,
    dependencies=[
        Depends(require_permission("users.delete")),
        Depends(require_security_onboarding),
    ],
)
def delete_invitation(
    invitation_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    svc: InvitationsService = Depends(get_service),
):
    inv = svc.get(invitation_id)
    if not is_platform_admin(db, current_user) and inv.organization_id != require_tenant_context(request, db, current_user).id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    return _to_read(svc.expire(invitation_id))

