from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enums import MembershipStatus, OrganizationStatus, OrganizationType
from app.models.member_role import MemberRole
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.modules.organization_members.repository import OrganizationMembersRepository
from app.modules.organization_members.schemas import OrganizationMemberCreate, OrganizationMemberUpdate


class OrganizationMembersService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OrganizationMembersRepository(db)

    def create(self, payload: OrganizationMemberCreate) -> OrganizationMember:
        org_id = self.repo.get_organization_id(
            organization_id=payload.organization_id, organization_uuid=payload.organization_uuid
        )
        if org_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization not found")

        usr_id = self.repo.get_user_id(user_id=payload.user_id, user_uuid=payload.user_uuid)
        if usr_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

        existing = self.repo.get_by_org_user(organization_id=org_id, user_id=usr_id)
        if existing is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member of this organization")

        member = OrganizationMember(
            organization_id=org_id,
            user_id=usr_id,
            membership_status=payload.membership_status,
        )

        try:
            self.repo.add(member)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate member for organization")

        self.db.refresh(member)
        return member

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None = None,
        user_id: int | None = None,
    ) -> tuple[list[OrganizationMember], int]:
        return self.repo.list(limit=limit, offset=offset, organization_id=organization_id, user_id=user_id)

    def get(self, member_id: int) -> OrganizationMember:
        member = self.repo.get(member_id)
        if member is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization member not found")
        return member

    def update(self, member_id: int, payload: OrganizationMemberUpdate) -> OrganizationMember:
        member = self.get(member_id)

        if payload.membership_status is not None:
            member.membership_status = payload.membership_status
        if payload.joined_at is not None:
            member.joined_at = payload.joined_at

        self.db.commit()
        self.db.refresh(member)
        return member

    def suspend(self, member_id: int) -> OrganizationMember:
        member = self.get(member_id)
        member.membership_status = MembershipStatus.suspended
        self.db.commit()
        self.db.refresh(member)
        return member

    def leave(self, *, organization_id: int, user_id: int) -> None:
        """Self-service counterpart to `suspend()`: a member removes
        themselves from an organization, instead of an admin acting on
        someone else. Kept as a separate method (rather than routing this
        through `suspend`) because the guards are different in kind, not
        just in permission level:

        - Leaving your own individual workspace makes no sense — it's a
          single-member org that exists purely to anchor your personal
          purchases/roles, not a team. Direct the user to delete it
          instead (see `OrganizationsService.soft_delete`).
        - A member who holds super_admin through this specific org, with
          no *other* active organization, can't leave — the exact lockout
          `OrganizationsService._would_orphan_a_super_admin` guards
          against on the admin side, just triggered here by the member's
          own action instead of an org being suspended/deleted under
          them. Checked before the owner branch below so it still applies
          even when leaving would otherwise auto-delete the organization.
        - The org's owner CAN leave. If other active members remain,
          `owner_user_id` would become a dangling reference, so ownership
          must be transferred first. But if the owner is the organization's
          only active member, there's nothing left to hand ownership to —
          leaving in that case soft-deletes the organization itself
          (same `status = deleted` transition as
          `OrganizationsService.soft_delete`), consistent with an org
          being, at its core, just its owner plus whoever they've invited.

        The membership row is hard-deleted (not just marked suspended):
        there's no "left" status in `MembershipStatus`, and unlike a
        suspension — which an admin might want to reverse — leaving is a
        deliberate, final action the member chose themselves. Re-joining
        later creates a fresh membership row.
        """
        member = self.repo.get_by_org_user(organization_id=organization_id, user_id=user_id)
        if member is None or member.membership_status == MembershipStatus.suspended:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You are not a member of this organization")

        org = member.organization
        if org.type == OrganizationType.individual:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This is your individual workspace — delete it instead of leaving it.",
            )

        holds_super_admin_here = self.db.execute(
            select(MemberRole.id)
            .join(Role, Role.id == MemberRole.role_id)
            .where(MemberRole.organization_member_id == member.id, Role.code == "super_admin")
        ).scalar_one_or_none() is not None

        if holds_super_admin_here:
            other_active = self.db.execute(
                select(func.count())
                .select_from(OrganizationMember)
                .join(Organization, Organization.id == OrganizationMember.organization_id)
                .where(
                    OrganizationMember.user_id == user_id,
                    OrganizationMember.organization_id != organization_id,
                    OrganizationMember.membership_status == MembershipStatus.active,
                    Organization.status == OrganizationStatus.active,
                )
            ).scalar_one()
            if other_active == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Leaving would lock you out of your own workspace — this is your only active "
                        "organization as a super_admin."
                    ),
                )

        if org.owner_user_id == user_id:
            other_members = self.db.execute(
                select(func.count())
                .select_from(OrganizationMember)
                .where(
                    OrganizationMember.organization_id == organization_id,
                    OrganizationMember.user_id != user_id,
                    OrganizationMember.membership_status == MembershipStatus.active,
                )
            ).scalar_one()
            if other_members > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You are the owner of this organization. Transfer ownership to someone else before leaving.",
                )
            # Owner is the only active member left — nobody to hand
            # ownership to, so leaving takes the organization down with it.
            org.status = OrganizationStatus.deleted

        self.repo.delete(member)
        self.db.commit()

