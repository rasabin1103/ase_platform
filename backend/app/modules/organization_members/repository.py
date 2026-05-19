from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User


class OrganizationMembersRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, member_id: int) -> OrganizationMember | None:
        stmt = select(OrganizationMember).where(OrganizationMember.id == member_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_org_user(self, *, organization_id: int, user_id: int) -> OrganizationMember | None:
        stmt = select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_organization_id(self, *, organization_id: int | None, organization_uuid: UUID | None) -> int | None:
        if organization_id is not None:
            return organization_id
        if organization_uuid is None:
            return None
        stmt = select(Organization.id).where(Organization.uuid == organization_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_user_id(self, *, user_id: int | None, user_uuid: UUID | None) -> int | None:
        if user_id is not None:
            return user_id
        if user_uuid is None:
            return None
        stmt = select(User.id).where(User.uuid == user_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None = None,
        user_id: int | None = None,
    ) -> tuple[list[OrganizationMember], int]:
        base = select(OrganizationMember)
        if organization_id is not None:
            base = base.where(OrganizationMember.organization_id == organization_id)
        if user_id is not None:
            base = base.where(OrganizationMember.user_id == user_id)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(OrganizationMember.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, member: OrganizationMember) -> OrganizationMember:
        self.db.add(member)
        self.db.flush()
        return member

