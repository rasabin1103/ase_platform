from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import UserStatus
from app.models.organization_member import OrganizationMember
from app.models.user import User


class UsersRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_uuid(self, user_uuid: UUID) -> User | None:
        stmt = select(User).where(User.uuid == user_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(self, *, limit: int, offset: int, include_deleted: bool = False) -> tuple[list[User], int]:
        base = select(User)
        if not include_deleted:
            base = base.where(User.status != UserStatus.deleted)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(User.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def list_by_organization(
        self,
        *,
        organization_id: int,
        limit: int,
        offset: int,
        include_deleted: bool = False,
    ) -> tuple[list[User], int]:
        base = select(User).join(OrganizationMember, OrganizationMember.user_id == User.id).where(
            OrganizationMember.organization_id == organization_id
        )
        if not include_deleted:
            base = base.where(User.status != UserStatus.deleted)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(User.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def get_by_uuid_in_organization(self, *, user_uuid: UUID, organization_id: int) -> User | None:
        stmt = (
            select(User)
            .join(OrganizationMember, OrganizationMember.user_id == User.id)
            .where(User.uuid == user_uuid, OrganizationMember.organization_id == organization_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def add(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

