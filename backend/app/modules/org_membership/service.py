from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.enums import (
    MembershipStatus,
    OrganizationJoinRequestStatus,
    OrganizationMemberInviteStatus,
    OrganizationStatus,
)
from app.models.member_role import MemberRole
from app.models.organization_join_request import OrganizationJoinRequest
from app.models.organization_member import OrganizationMember
from app.models.organization_member_invite import OrganizationMemberInvite
from app.models.user import User
from app.modules.notifications.service import NotificationsService
from app.modules.org_membership.repository import OrgMembershipRepository
from app.modules.org_membership.schemas import (
    JoinRequestCreate,
    JoinRequestListResponse,
    JoinRequestRead,
    MemberInviteCreate,
    MemberInviteListResponse,
    MemberInviteRead,
    OrganizationSearchItem,
    OrganizationSearchResponse,
    UserSearchItem,
    UserSearchResponse,
)

logger = logging.getLogger(__name__)

DEFAULT_MEMBER_ROLE_CODE = "member"


class OrgMembershipService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OrgMembershipRepository(db)

    # ---- organization directory ----

    def search_organizations(
        self, *, q: str | None, current_user: User, limit: int, offset: int,
    ) -> OrganizationSearchResponse:
        items, total = self.repo.search_organizations(q=q, limit=limit, offset=offset)
        org_ids = [o.id for o in items]
        counts = self.repo.member_counts(org_ids)
        pending = self.repo.pending_join_request_org_ids(user_id=current_user.id, org_ids=org_ids)
        mapped = [
            OrganizationSearchItem(
                uuid=o.uuid,
                name=o.name,
                slug=o.slug,
                type=o.type,
                member_count=counts.get(o.id, 0),
                has_pending_request=o.id in pending,
            )
            for o in items
        ]
        return OrganizationSearchResponse(items=mapped, limit=limit, offset=offset, total=total)

    # ---- join requests: requester side ----

    def create_join_request(
        self, *, organization_uuid: UUID, payload: JoinRequestCreate, current_user: User,
    ) -> JoinRequestRead:
        org = self.repo.get_org_by_uuid(organization_uuid)
        if org is None or org.status != OrganizationStatus.active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
        if self.repo.has_active_membership(user_id=current_user.id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already belong to an organization")
        if self.repo.get_pending_join_request(organization_id=org.id, user_id=current_user.id) is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="A pending request already exists for this organization",
            )

        item = OrganizationJoinRequest(
            organization_id=org.id,
            user_id=current_user.id,
            status=OrganizationJoinRequestStatus.pending,
            message=payload.message,
        )
        self.repo.add_join_request(item)
        self.db.commit()
        self.db.refresh(item)

        try:
            NotificationsService(self.db).notify_user(
                user_id=org.owner_user_id,
                type="org_join_request_created",
                title=f"Nueva solicitud para unirse a {org.name}",
                body=current_user.display_name or current_user.email,
                link="/admin/members",
            )
        except Exception:
            self.db.rollback()
            logger.exception("Failed to notify organization owner about join request %s", item.id)

        return self._join_request_to_read(self.repo.get_join_request(item.id))

    def list_my_join_requests(self, *, current_user: User, limit: int, offset: int) -> JoinRequestListResponse:
        items, total = self.repo.list_join_requests_for_user(user_id=current_user.id, limit=limit, offset=offset)
        return JoinRequestListResponse(
            items=[self._join_request_to_read(i) for i in items], limit=limit, offset=offset, total=total,
        )

    def cancel_join_request(self, *, request_id: int, current_user: User) -> JoinRequestRead:
        item = self.repo.get_join_request(request_id)
        if item is None or item.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
        if item.status != OrganizationJoinRequestStatus.pending:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request is not pending")
        self.repo.mark_join_request(item, status=OrganizationJoinRequestStatus.cancelled, reviewer_id=None)
        self.db.commit()
        self.db.refresh(item)
        return self._join_request_to_read(item)

    # ---- join requests: organization owner side ----

    def list_join_requests_for_organization(
        self, *, organization_id: int, status_filter: OrganizationJoinRequestStatus | None, limit: int, offset: int,
    ) -> JoinRequestListResponse:
        items, total = self.repo.list_join_requests_for_organization(
            organization_id=organization_id, status=status_filter, limit=limit, offset=offset,
        )
        return JoinRequestListResponse(
            items=[self._join_request_to_read(i) for i in items], limit=limit, offset=offset, total=total,
        )

    def approve_join_request(self, *, request_id: int, owner: User) -> JoinRequestRead:
        item = self.repo.get_join_request(request_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
        if item.organization.owner_user_id != owner.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the organization owner can approve requests")
        if item.status != OrganizationJoinRequestStatus.pending:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request is not pending")
        if self.repo.has_active_membership(user_id=item.user_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Requesting user already belongs to an organization")

        role = self.repo.get_role_by_code(DEFAULT_MEMBER_ROLE_CODE)
        if role is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Required role 'member' does not exist")

        now = datetime.now(timezone.utc)
        member = OrganizationMember(
            organization_id=item.organization_id,
            user_id=item.user_id,
            membership_status=MembershipStatus.active,
            joined_at=now,
        )
        self.repo.add_member(member)
        self.repo.add_member_role(
            MemberRole(organization_member_id=member.id, role_id=role.id, assigned_by_user_id=owner.id)
        )
        self.db.add(
            AuditLog(
                organization_id=item.organization_id,
                actor_user_id=owner.id,
                action="org_membership.join_request_approved",
                entity_type="organization_join_request",
                entity_id=item.id,
                metadata_json={"user_id": item.user_id},
            )
        )

        self.repo.mark_join_request(item, status=OrganizationJoinRequestStatus.approved, reviewer_id=owner.id)
        self.db.commit()
        self.db.refresh(item)

        try:
            NotificationsService(self.db).notify_user(
                user_id=item.user_id,
                type="org_join_request_approved",
                title=f"Tu solicitud para unirte a {item.organization.name} fue aceptada",
                link="/dashboard",
            )
        except Exception:
            self.db.rollback()
            logger.exception("Failed to notify user about approved join request %s", item.id)

        return self._join_request_to_read(self.repo.get_join_request(item.id))

    def reject_join_request(self, *, request_id: int, owner: User) -> JoinRequestRead:
        item = self.repo.get_join_request(request_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
        if item.organization.owner_user_id != owner.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the organization owner can reject requests")
        if item.status != OrganizationJoinRequestStatus.pending:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request is not pending")

        self.repo.mark_join_request(item, status=OrganizationJoinRequestStatus.rejected, reviewer_id=owner.id)
        self.db.commit()
        self.db.refresh(item)

        try:
            NotificationsService(self.db).notify_user(
                user_id=item.user_id,
                type="org_join_request_rejected",
                title=f"Tu solicitud para unirte a {item.organization.name} fue rechazada",
                link="/onboarding",
            )
        except Exception:
            self.db.rollback()
            logger.exception("Failed to notify user about rejected join request %s", item.id)

        return self._join_request_to_read(self.repo.get_join_request(item.id))

    # ---- member invites: organization owner side ----

    def search_unaffiliated_users(
        self, *, q: str | None, current_user: User, limit: int, offset: int,
    ) -> UserSearchResponse:
        items, total = self.repo.search_unaffiliated_users(
            q=q, exclude_user_id=current_user.id, limit=limit, offset=offset,
        )
        return UserSearchResponse(
            items=[UserSearchItem.model_validate(u) for u in items], limit=limit, offset=offset, total=total,
        )

    def create_invite(
        self, *, organization_id: int, payload: MemberInviteCreate, inviter: User,
    ) -> MemberInviteRead:
        target = self.repo.get_user_by_uuid(payload.user_uuid)
        if target is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if self.repo.has_active_membership(user_id=target.id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already belongs to an organization")
        if self.repo.get_pending_invite(organization_id=organization_id, invited_user_id=target.id) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A pending invite already exists for this user")

        item = OrganizationMemberInvite(
            organization_id=organization_id,
            invited_user_id=target.id,
            invited_by_user_id=inviter.id,
            status=OrganizationMemberInviteStatus.pending,
        )
        self.repo.add_invite(item)
        self.db.commit()
        self.db.refresh(item)

        try:
            NotificationsService(self.db).notify_user(
                user_id=target.id,
                type="org_member_invite_created",
                title="Has recibido una invitación para unirte a una organización",
                link="/onboarding",
            )
        except Exception:
            self.db.rollback()
            logger.exception("Failed to notify user about new member invite %s", item.id)

        return self._invite_to_read(self.repo.get_invite(item.id))

    def list_invites_for_organization(
        self, *, organization_id: int, status_filter: OrganizationMemberInviteStatus | None, limit: int, offset: int,
    ) -> MemberInviteListResponse:
        items, total = self.repo.list_invites_for_organization(
            organization_id=organization_id, status=status_filter, limit=limit, offset=offset,
        )
        return MemberInviteListResponse(
            items=[self._invite_to_read(i) for i in items], limit=limit, offset=offset, total=total,
        )

    def cancel_invite(self, *, invite_id: int, owner: User) -> MemberInviteRead:
        item = self.repo.get_invite(invite_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
        if item.organization.owner_user_id != owner.id and item.invited_by_user_id != owner.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
        if item.status != OrganizationMemberInviteStatus.pending:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite is not pending")
        self.repo.mark_invite(item, status=OrganizationMemberInviteStatus.cancelled)
        self.db.commit()
        self.db.refresh(item)
        return self._invite_to_read(item)

    # ---- member invites: invited user side ----

    def list_my_invites(self, *, current_user: User, limit: int, offset: int) -> MemberInviteListResponse:
        items, total = self.repo.list_invites_for_user(user_id=current_user.id, limit=limit, offset=offset)
        return MemberInviteListResponse(
            items=[self._invite_to_read(i) for i in items], limit=limit, offset=offset, total=total,
        )

    def accept_invite(self, *, invite_id: int, current_user: User) -> MemberInviteRead:
        item = self.repo.get_invite(invite_id)
        if item is None or item.invited_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
        if item.status != OrganizationMemberInviteStatus.pending:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite is not pending")
        if self.repo.has_active_membership(user_id=current_user.id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You already belong to an organization")

        role = self.repo.get_role_by_code(DEFAULT_MEMBER_ROLE_CODE)
        if role is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Required role 'member' does not exist")

        now = datetime.now(timezone.utc)
        member = OrganizationMember(
            organization_id=item.organization_id,
            user_id=current_user.id,
            membership_status=MembershipStatus.active,
            joined_at=now,
        )
        self.repo.add_member(member)
        self.repo.add_member_role(
            MemberRole(
                organization_member_id=member.id, role_id=role.id, assigned_by_user_id=item.invited_by_user_id,
            )
        )
        self.db.add(
            AuditLog(
                organization_id=item.organization_id,
                actor_user_id=current_user.id,
                action="org_membership.invite_accepted",
                entity_type="organization_member_invite",
                entity_id=item.id,
                metadata_json={"user_id": current_user.id},
            )
        )

        self.repo.mark_invite(item, status=OrganizationMemberInviteStatus.accepted)
        self.db.commit()
        self.db.refresh(item)

        try:
            NotificationsService(self.db).notify_user(
                user_id=item.invited_by_user_id,
                type="org_member_invite_accepted",
                title=f"{current_user.display_name or current_user.email} aceptó tu invitación",
                link="/admin/members",
            )
        except Exception:
            self.db.rollback()
            logger.exception("Failed to notify inviter about accepted invite %s", item.id)

        return self._invite_to_read(self.repo.get_invite(item.id))

    def decline_invite(self, *, invite_id: int, current_user: User) -> MemberInviteRead:
        item = self.repo.get_invite(invite_id)
        if item is None or item.invited_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
        if item.status != OrganizationMemberInviteStatus.pending:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite is not pending")
        self.repo.mark_invite(item, status=OrganizationMemberInviteStatus.declined)
        self.db.commit()
        self.db.refresh(item)

        try:
            NotificationsService(self.db).notify_user(
                user_id=item.invited_by_user_id,
                type="org_member_invite_declined",
                title=f"{current_user.display_name or current_user.email} rechazó tu invitación",
                link="/admin/members",
            )
        except Exception:
            self.db.rollback()
            logger.exception("Failed to notify inviter about declined invite %s", item.id)

        return self._invite_to_read(item)

    # ---- mappers ----

    def _join_request_to_read(self, item: OrganizationJoinRequest) -> JoinRequestRead:
        return JoinRequestRead(
            id=item.id,
            organization_uuid=item.organization.uuid,
            organization_name=item.organization.name,
            user_uuid=item.user.uuid,
            user_display_name=item.user.display_name,
            user_email=item.user.email,
            status=item.status,
            message=item.message,
            created_at=item.created_at,
            reviewed_at=item.reviewed_at,
        )

    def _invite_to_read(self, item: OrganizationMemberInvite) -> MemberInviteRead:
        return MemberInviteRead(
            id=item.id,
            organization_uuid=item.organization.uuid,
            organization_name=item.organization.name,
            invited_user_uuid=item.invited_user.uuid,
            invited_user_display_name=item.invited_user.display_name,
            invited_user_email=item.invited_user.email,
            invited_by_user_uuid=item.invited_by_user.uuid,
            status=item.status,
            created_at=item.created_at,
            responded_at=item.responded_at,
        )
