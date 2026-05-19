from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.role_permission import RolePermission
from app.modules.role_permissions.repository import RolePermissionsRepository
from app.modules.role_permissions.schemas import RolePermissionCreate


class RolePermissionsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = RolePermissionsRepository(db)

    def create(self, payload: RolePermissionCreate) -> RolePermission:
        if not self.repo.role_exists(payload.role_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role not found")
        if not self.repo.permission_exists(payload.permission_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Permission not found")

        if self.repo.get_by_pair(role_id=payload.role_id, permission_id=payload.permission_id) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role permission already exists")

        rp = RolePermission(role_id=payload.role_id, permission_id=payload.permission_id)
        try:
            self.repo.add(rp)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role permission already exists")

        self.db.refresh(rp)
        return rp

    def list(
        self,
        *,
        limit: int,
        offset: int,
        role_id: int | None = None,
        permission_id: int | None = None,
    ) -> tuple[list[RolePermission], int]:
        return self.repo.list(limit=limit, offset=offset, role_id=role_id, permission_id=permission_id)

    def get(self, role_permission_id: int) -> RolePermission:
        rp = self.repo.get(role_permission_id)
        if rp is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role permission not found")
        return rp

    def delete(self, role_permission_id: int) -> None:
        rp = self.get(role_permission_id)
        self.repo.delete(rp)
        self.db.commit()

