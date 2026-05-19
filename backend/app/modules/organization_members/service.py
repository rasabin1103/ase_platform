from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enums import MembershipStatus
from app.models.organization_member import OrganizationMember
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

