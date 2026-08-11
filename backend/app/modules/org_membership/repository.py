from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import (
    MembershipStatus,
    OrganizationJoinRequestStatus,
    OrganizationMemberInviteStatus,
    OrganizationStatus,
    OrganizationType,
    UserStatus,
)
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_join_request import OrganizationJoinRequest
from app.models.organization_member import OrganizationMember
from app.models.organization_member_invite import OrganizationMemberInvite
from app.models.role import Role
from app.models.user import User


class OrgMembershipRepository:
    def __init__(self, db: Session):
        self.db = db

    # -- shared -----------------------------------------------------------

    def get_role_by_code(self, code: str) -> Role | None:
        return self.db.execute(select(Role).where(Role.code == code)).scalar_one_or_none()

    def get_org_by_uuid(self, org_uuid: UUID) -> Organization | None:
        return self.db.execute(
            select(Organization).where(Organization.uuid == org_uuid)
        ).scalar_one_or_none()

    def get_user_by_uuid(self, user_uuid: UUID) -> User | None:
        return self.db.execute(select(User).where(User.uuid == user_uuid)).scalar_one_or_none()

    def has_active_membership(self, *, user_id: int) -> bool:
        """True if the user actively belongs to a *real* organization
        (business/enterprise/academy). A personal ``individual`` workspace
        does not count — independent users may still search for and join a
        real organization even after creating their solo workspace."""
        return self.db.execute(
            select(OrganizationMember.id)
            .join(Organization, Organization.id == OrganizationMember.organization_id)
            .where(
                OrganizationMember.user_id == user_id,
                OrganizationMember.membership_status == MembershipStatus.active,
                Organization.type != OrganizationType.individual,
            ).limit(1)
        ).scalar_one_or_none() is not None

    def add_member(self, member: OrganizationMember) -> OrganizationMember:
        self.db.add(member)
        self.db.flush()
        return member

    def add_member_role(self, mr: MemberRole) -> MemberRole:
        self.db.add(mr)
        self.db.flush()
        return mr

    # -- organization directory -------------------------------------------

    def search_organizations(
        self, *, q: str | None, limit: int, offset: int,
    ) -> tuple[list[Organization], int]:
        base = select(Organization).where(
            Organization.status == OrganizationStatus.active,
            Organization.type != OrganizationType.individual,
        )
        if q:
            like = f"%{q.strip()}%"
            base = base.where(or_(Organization.name.ilike(like), Organization.slug.ilike(like)))

        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = base.order_by(Organization.name.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def member_counts(self, org_ids: list[int]) -> dict[int, int]:
        if not org_ids:
            return {}
        rows = self.db.execute(
            select(OrganizationMember.organization_id, func.count(OrganizationMember.id))
            .where(
                OrganizationMember.organization_id.in_(org_ids),
                OrganizationMember.membership_status == MembershipStatus.active,
            )
            .group_by(OrganizationMember.organization_id)
        ).all()
        return {org_id: count for org_id, count in rows}

    def pending_join_request_org_ids(self, *, user_id: int, org_ids: list[int]) -> set[int]:
        if not org_ids:
            return set()
        rows = self.db.execute(
            select(OrganizationJoinRequest.organization_id).where(
                OrganizationJoinRequest.user_id == user_id,
                OrganizationJoinRequest.organization_id.in_(org_ids),
                OrganizationJoinRequest.status == OrganizationJoinRequestStatus.pending,
            )
        ).scalars().all()
        return set(rows)

    # -- join requests ------------------------------------------------------

    def get_pending_join_request(self, *, organization_id: int, user_id: int) -> OrganizationJoinRequest | None:
        return self.db.execute(
            select(OrganizationJoinRequest).where(
                OrganizationJoinRequest.organization_id == organization_id,
                OrganizationJoinRequest.user_id == user_id,
                OrganizationJoinRequest.status == OrganizationJoinRequestStatus.pending,
            )
        ).scalar_one_or_none()

    def add_join_request(self, item: OrganizationJoinRequest) -> OrganizationJoinRequest:
        self.db.add(item)
        self.db.flush()
        return item

    def _join_request_query(self):
        return select(OrganizationJoinRequest).options(
            selectinload(OrganizationJoinRequest.organization),
            selectinload(OrganizationJoinRequest.user),
            selectinload(OrganizationJoinRequest.reviewed_by_user),
        )

    def get_join_request(self, request_id: int) -> OrganizationJoinRequest | None:
        return self.db.execute(
            self._join_request_query().where(OrganizationJoinRequest.id == request_id)
        ).scalar_one_or_none()

    def list_join_requests_for_organization(
        self, *, organization_id: int, status: OrganizationJoinRequestStatus | None, limit: int, offset: int,
    ) -> tuple[list[OrganizationJoinRequest], int]:
        base = select(OrganizationJoinRequest).where(OrganizationJoinRequest.organization_id == organization_id)
        if status is not None:
            base = base.where(OrganizationJoinRequest.status == status)
        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = self._join_request_query().where(OrganizationJoinRequest.organization_id == organization_id)
        if status is not None:
            stmt = stmt.where(OrganizationJoinRequest.status == status)
        stmt = stmt.order_by(OrganizationJoinRequest.created_at.desc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def list_join_requests_for_user(
        self, *, user_id: int, limit: int, offset: int,
    ) -> tuple[list[OrganizationJoinRequest], int]:
        base = select(OrganizationJoinRequest).where(OrganizationJoinRequest.user_id == user_id)
        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = (
            self._join_request_query()
            .where(OrganizationJoinRequest.user_id == user_id)
            .order_by(OrganizationJoinRequest.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def mark_join_request(
        self, item: OrganizationJoinRequest, *, status: OrganizationJoinRequestStatus, reviewer_id: int | None,
    ) -> OrganizationJoinRequest:
        item.status = status
        item.reviewed_by_user_id = reviewer_id
        item.reviewed_at = datetime.now(timezone.utc)
        self.db.flush()
        return item

    # -- member invites -------------------------------------------------------

    def search_unaffiliated_users(
        self, *, q: str | None, exclude_user_id: int, limit: int, offset: int,
    ) -> tuple[list[User], int]:
        # A personal `individual` workspace doesn't count as "belonging to an
        # organization" here — independent users should still be invitable.
        active_member_user_ids = (
            select(OrganizationMember.user_id)
            .join(Organization, Organization.id == OrganizationMember.organization_id)
            .where(
                OrganizationMember.membership_status == MembershipStatus.active,
                Organization.type != OrganizationType.individual,
            )
        )
        base = select(User).where(
            User.id != exclude_user_id,
            User.status == UserStatus.active,
            User.id.notin_(active_member_user_ids),
        )
        if q:
            like = f"%{q.strip()}%"
            base = base.where(
                or_(
                    User.email.ilike(like),
                    User.display_name.ilike(like),
                    User.first_name.ilike(like),
                    User.last_name.ilike(like),
                )
            )
        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = base.order_by(User.email.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def get_pending_invite(self, *, organization_id: int, invited_user_id: int) -> OrganizationMemberInvite | None:
        return self.db.execute(
            select(OrganizationMemberInvite).where(
                OrganizationMemberInvite.organization_id == organization_id,
                OrganizationMemberInvite.invited_user_id == invited_user_id,
                OrganizationMemberInvite.status == OrganizationMemberInviteStatus.pending,
            )
        ).scalar_one_or_none()

    def add_invite(self, item: OrganizationMemberInvite) -> OrganizationMemberInvite:
        self.db.add(item)
        self.db.flush()
        return item

    def _invite_query(self):
        return select(OrganizationMemberInvite).options(
            selectinload(OrganizationMemberInvite.organization),
            selectinload(OrganizationMemberInvite.invited_user),
            selectinload(OrganizationMemberInvite.invited_by_user),
        )

    def get_invite(self, invite_id: int) -> OrganizationMemberInvite | None:
        return self.db.execute(
            self._invite_query().where(OrganizationMemberInvite.id == invite_id)
        ).scalar_one_or_none()

    def list_invites_for_organization(
        self, *, organization_id: int, status: OrganizationMemberInviteStatus | None, limit: int, offset: int,
    ) -> tuple[list[OrganizationMemberInvite], int]:
        base = select(OrganizationMemberInvite).where(OrganizationMemberInvite.organization_id == organization_id)
        if status is not None:
            base = base.where(OrganizationMemberInvite.status == status)
        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = self._invite_query().where(OrganizationMemberInvite.organization_id == organization_id)
        if status is not None:
            stmt = stmt.where(OrganizationMemberInvite.status == status)
        stmt = stmt.order_by(OrganizationMemberInvite.created_at.desc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def list_invites_for_user(
        self, *, user_id: int, limit: int, offset: int,
    ) -> tuple[list[OrganizationMemberInvite], int]:
        base = select(OrganizationMemberInvite).where(OrganizationMemberInvite.invited_user_id == user_id)
        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = (
            self._invite_query()
            .where(OrganizationMemberInvite.invited_user_id == user_id)
            .order_by(OrganizationMemberInvite.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def mark_invite(
        self, item: OrganizationMemberInvite, *, status: OrganizationMemberInviteStatus,
    ) -> OrganizationMemberInvite:
        item.status = status
        item.responded_at = datetime.now(timezone.utc)
        self.db.flush()
        return item
