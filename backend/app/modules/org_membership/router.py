from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.enums import OrganizationJoinRequestStatus, OrganizationMemberInviteStatus
from app.models.user import User
from app.modules.auth.dependencies import get_current_active_user, require_permission, require_tenant_context
from app.modules.org_membership.schemas import (
    JoinRequestCreate,
    JoinRequestListResponse,
    JoinRequestRead,
    MemberInviteCreate,
    MemberInviteListResponse,
    MemberInviteRead,
    OrganizationSearchResponse,
    UserSearchResponse,
)
from app.modules.org_membership.service import OrgMembershipService

router = APIRouter(prefix="/api/v1/org-membership", tags=["org-membership"])


def get_service(db: Session = Depends(get_db)) -> OrgMembershipService:
    return OrgMembershipService(db)


# ---- organization directory (any authenticated user, incl. users with no org) ----


@router.get("/organizations/search", response_model=OrganizationSearchResponse)
def search_organizations(
    q: str | None = Query(default=None, max_length=200),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    return svc.search_organizations(q=q, current_user=current_user, limit=limit, offset=offset)


# ---- join requests: requester side ----


@router.post(
    "/organizations/{organization_uuid}/join-requests",
    response_model=JoinRequestRead,
    status_code=status.HTTP_201_CREATED,
)
def create_join_request(
    organization_uuid: UUID,
    payload: JoinRequestCreate,
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    return svc.create_join_request(organization_uuid=organization_uuid, payload=payload, current_user=current_user)


@router.get("/join-requests/mine", response_model=JoinRequestListResponse)
def list_my_join_requests(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    return svc.list_my_join_requests(current_user=current_user, limit=limit, offset=offset)


@router.post("/join-requests/{request_id}/cancel", response_model=JoinRequestRead)
def cancel_join_request(
    request_id: int,
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    return svc.cancel_join_request(request_id=request_id, current_user=current_user)


# ---- join requests: organization owner side ----


@router.get(
    "/join-requests",
    response_model=JoinRequestListResponse,
    dependencies=[Depends(require_permission("users.read"))],
)
def list_join_requests_for_organization(
    request: Request,
    status_filter: OrganizationJoinRequestStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    org = require_tenant_context(request, db, current_user)
    return svc.list_join_requests_for_organization(
        organization_id=org.id, status_filter=status_filter, limit=limit, offset=offset,
    )


@router.post("/join-requests/{request_id}/approve", response_model=JoinRequestRead)
def approve_join_request(
    request_id: int,
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    return svc.approve_join_request(request_id=request_id, owner=current_user)


@router.post("/join-requests/{request_id}/reject", response_model=JoinRequestRead)
def reject_join_request(
    request_id: int,
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    return svc.reject_join_request(request_id=request_id, owner=current_user)


# ---- member invites: organization owner side ----


@router.get(
    "/users/search",
    response_model=UserSearchResponse,
    dependencies=[Depends(require_permission("users.create"))],
)
def search_unaffiliated_users(
    q: str | None = Query(default=None, max_length=200),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    return svc.search_unaffiliated_users(q=q, current_user=current_user, limit=limit, offset=offset)


@router.post(
    "/member-invites",
    response_model=MemberInviteRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("users.create"))],
)
def create_member_invite(
    payload: MemberInviteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    org = require_tenant_context(request, db, current_user)
    return svc.create_invite(organization_id=org.id, payload=payload, inviter=current_user)


@router.get(
    "/member-invites",
    response_model=MemberInviteListResponse,
    dependencies=[Depends(require_permission("users.read"))],
)
def list_member_invites_for_organization(
    request: Request,
    status_filter: OrganizationMemberInviteStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    org = require_tenant_context(request, db, current_user)
    return svc.list_invites_for_organization(
        organization_id=org.id, status_filter=status_filter, limit=limit, offset=offset,
    )


@router.post("/member-invites/{invite_id}/cancel", response_model=MemberInviteRead)
def cancel_member_invite(
    invite_id: int,
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    return svc.cancel_invite(invite_id=invite_id, owner=current_user)


# ---- member invites: invited user side ----


@router.get("/member-invites/mine", response_model=MemberInviteListResponse)
def list_my_member_invites(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    return svc.list_my_invites(current_user=current_user, limit=limit, offset=offset)


@router.post("/member-invites/{invite_id}/accept", response_model=MemberInviteRead)
def accept_member_invite(
    invite_id: int,
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    return svc.accept_invite(invite_id=invite_id, current_user=current_user)


@router.post("/member-invites/{invite_id}/decline", response_model=MemberInviteRead)
def decline_member_invite(
    invite_id: int,
    current_user: User = Depends(get_current_active_user),
    svc: OrgMembershipService = Depends(get_service),
):
    return svc.decline_invite(invite_id=invite_id, current_user=current_user)
