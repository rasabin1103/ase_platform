from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.invitation import Invitation
from app.models.member_role import MemberRole
from app.models.role import Role
from app.models.role_permission import RolePermission


class RolesRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, role_id: int) -> Role | None:
        stmt = select(Role).where(Role.id == role_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_code(self, code: str) -> Role | None:
        stmt = select(Role).where(Role.code == code)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(self, *, limit: int, offset: int) -> tuple[list[Role], int]:
        base = select(Role)
        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(Role.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, role: Role) -> Role:
        self.db.add(role)
        self.db.flush()
        return role

    def delete(self, role: Role) -> None:
        self.db.delete(role)

    def count_relations(self, role_id: int) -> dict[str, int]:
        rp = int(self.db.execute(select(func.count()).select_from(RolePermission).where(RolePermission.role_id == role_id)).scalar_one())
        mr = int(self.db.execute(select(func.count()).select_from(MemberRole).where(MemberRole.role_id == role_id)).scalar_one())
        inv = int(self.db.execute(select(func.count()).select_from(Invitation).where(Invitation.role_id == role_id)).scalar_one())
        return {"role_permissions": rp, "member_roles": mr, "invitations": inv}

