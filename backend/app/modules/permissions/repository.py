from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.role_permission import RolePermission


class PermissionsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, permission_id: int) -> Permission | None:
        stmt = select(Permission).where(Permission.id == permission_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_code(self, code: str) -> Permission | None:
        stmt = select(Permission).where(Permission.code == code)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(self, *, limit: int, offset: int) -> tuple[list[Permission], int]:
        base = select(Permission)
        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(Permission.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, permission: Permission) -> Permission:
        self.db.add(permission)
        self.db.flush()
        return permission

    def delete(self, permission: Permission) -> None:
        self.db.delete(permission)

    def count_relations(self, permission_id: int) -> dict[str, int]:
        rp = int(
            self.db.execute(
                select(func.count()).select_from(RolePermission).where(RolePermission.permission_id == permission_id)
            ).scalar_one()
        )
        return {"role_permissions": rp}

