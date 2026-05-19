from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission


class RolePermissionsRepository:
    def __init__(self, db: Session):
        self.db = db

    def role_exists(self, role_id: int) -> bool:
        stmt = select(func.count()).select_from(Role).where(Role.id == role_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def permission_exists(self, permission_id: int) -> bool:
        stmt = select(func.count()).select_from(Permission).where(Permission.id == permission_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def get(self, role_permission_id: int) -> RolePermission | None:
        stmt = select(RolePermission).where(RolePermission.id == role_permission_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_pair(self, *, role_id: int, permission_id: int) -> RolePermission | None:
        stmt = select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        role_id: int | None = None,
        permission_id: int | None = None,
    ) -> tuple[list[RolePermission], int]:
        base = select(RolePermission)
        if role_id is not None:
            base = base.where(RolePermission.role_id == role_id)
        if permission_id is not None:
            base = base.where(RolePermission.permission_id == permission_id)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(RolePermission.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, rp: RolePermission) -> RolePermission:
        self.db.add(rp)
        self.db.flush()
        return rp

    def delete(self, rp: RolePermission) -> None:
        self.db.delete(rp)

