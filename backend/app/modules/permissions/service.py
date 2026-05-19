from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.modules.permissions.repository import PermissionsRepository
from app.modules.permissions.schemas import PermissionCreate, PermissionUpdate


class PermissionsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PermissionsRepository(db)

    def create(self, payload: PermissionCreate) -> Permission:
        if self.repo.get_by_code(payload.code) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Permission code already exists")

        perm = Permission(code=payload.code, name=payload.name, module=payload.module, description=payload.description)
        self.repo.add(perm)
        self.db.commit()
        self.db.refresh(perm)
        return perm

    def list(self, *, limit: int, offset: int) -> tuple[list[Permission], int]:
        return self.repo.list(limit=limit, offset=offset)

    def get(self, permission_id: int) -> Permission:
        perm = self.repo.get(permission_id)
        if perm is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found")
        return perm

    def update(self, permission_id: int, payload: PermissionUpdate) -> Permission:
        perm = self.get(permission_id)

        if payload.code is not None and payload.code != perm.code:
            if self.repo.get_by_code(payload.code) is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Permission code already exists")
            perm.code = payload.code

        if payload.name is not None:
            perm.name = payload.name
        if payload.module is not None:
            perm.module = payload.module
        if payload.description is not None:
            perm.description = payload.description

        self.db.commit()
        self.db.refresh(perm)
        return perm

    def delete(self, permission_id: int) -> None:
        perm = self.get(permission_id)
        rel = self.repo.count_relations(permission_id)
        if any(v > 0 for v in rel.values()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Permission has relations and cannot be deleted", "relations": rel},
            )

        self.repo.delete(perm)
        self.db.commit()

