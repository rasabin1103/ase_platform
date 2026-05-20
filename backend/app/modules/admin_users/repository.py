from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app.models.enums import UserStatus
from app.models.member_role import MemberRole
from app.models.organization_member import OrganizationMember
from app.models.role import Role
from app.models.user import User
from app.modules.admin_users.cascade_delete import cascade_delete_user_dependencies
from app.modules.users.repository import UsersRepository


class AdminUsersRepository:
    def __init__(self, db: Session):
        self.db = db
        self.users = UsersRepository(db)

    def list_platform_users(
        self,
        *,
        limit: int,
        offset: int,
        status: UserStatus | None = None,
        role_code: str | None = None,
        search: str | None = None,
    ) -> tuple[list[User], int]:
        base = select(User).where(User.status != UserStatus.deleted)

        if status is not None:
            base = base.where(User.status == status)

        if search and search.strip():
            q = f"%{search.strip().lower()}%"
            base = base.where(
                or_(
                    func.lower(User.email).like(q),
                    func.lower(func.coalesce(User.first_name, "")).like(q),
                    func.lower(func.coalesce(User.last_name, "")).like(q),
                    func.lower(func.coalesce(User.display_name, "")).like(q),
                )
            )

        if role_code:
            base = (
                base.join(OrganizationMember, OrganizationMember.user_id == User.id)
                .join(MemberRole, MemberRole.organization_member_id == OrganizationMember.id)
                .join(Role, MemberRole.role_id == Role.id)
                .where(Role.code == role_code)
                .distinct()
            )

        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        items = list(
            self.db.execute(base.order_by(User.id.asc()).limit(limit).offset(offset)).scalars().all()
        )
        return items, total

    def get_by_uuid(self, user_uuid: UUID) -> User | None:
        return self.users.get_by_uuid(user_uuid)

    def add(self, user: User) -> User:
        return self.users.add(user)

    def delete_user_related_rows(self, user_id: int, *, reassign_org_owner_to: int | None) -> None:
        cascade_delete_user_dependencies(
            self.db,
            user_id,
            reassign_org_owner_to=reassign_org_owner_to,
        )

    def hard_delete_user_row(self, user: User) -> None:
        # Bulk DELETE avoids ORM loading optional relations (e.g. courses) missing in DB.
        self.db.execute(delete(User).where(User.id == user.id))
