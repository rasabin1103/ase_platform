from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.member_role import MemberRole
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User


class MemberRolesRepository:
    def __init__(self, db: Session):
        self.db = db

    def org_member_exists(self, organization_member_id: int) -> bool:
        stmt = select(func.count()).select_from(OrganizationMember).where(OrganizationMember.id == organization_member_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def role_exists(self, role_id: int) -> bool:
        stmt = select(func.count()).select_from(Role).where(Role.id == role_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def get_assigned_by_user_id(self, *, assigned_by_user_id: int | None, assigned_by_user_uuid: UUID | None) -> int | None:
        if assigned_by_user_id is not None:
            return assigned_by_user_id
        if assigned_by_user_uuid is None:
            return None
        stmt = select(User.id).where(User.uuid == assigned_by_user_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def get(self, member_role_id: int) -> MemberRole | None:
        stmt = select(MemberRole).where(MemberRole.id == member_role_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_pair(self, *, organization_member_id: int, role_id: int) -> MemberRole | None:
        stmt = select(MemberRole).where(
            MemberRole.organization_member_id == organization_member_id,
            MemberRole.role_id == role_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_member_id: int | None = None,
        role_id: int | None = None,
    ) -> tuple[list[MemberRole], int]:
        base = select(MemberRole)
        if organization_member_id is not None:
            base = base.where(MemberRole.organization_member_id == organization_member_id)
        if role_id is not None:
            base = base.where(MemberRole.role_id == role_id)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(MemberRole.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, mr: MemberRole) -> MemberRole:
        self.db.add(mr)
        self.db.flush()
        return mr

    def delete(self, mr: MemberRole) -> None:
        self.db.delete(mr)

