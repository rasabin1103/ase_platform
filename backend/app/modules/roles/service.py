from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.role import Role
from app.modules.roles.repository import RolesRepository
from app.modules.roles.schemas import RoleCreate, RoleUpdate


class RolesService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = RolesRepository(db)

    def create(self, payload: RoleCreate) -> Role:
        if self.repo.get_by_code(payload.code) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role code already exists")

        role = Role(code=payload.code, name=payload.name, scope=payload.scope, description=payload.description)
        self.repo.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role

    def list(self, *, limit: int, offset: int) -> tuple[list[Role], int]:
        return self.repo.list(limit=limit, offset=offset)

    def get(self, role_id: int) -> Role:
        role = self.repo.get(role_id)
        if role is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        return role

    def update(self, role_id: int, payload: RoleUpdate) -> Role:
        role = self.get(role_id)

        if payload.code is not None and payload.code != role.code:
            if self.repo.get_by_code(payload.code) is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role code already exists")
            role.code = payload.code

        if payload.name is not None:
            role.name = payload.name
        if payload.scope is not None:
            role.scope = payload.scope
        if payload.description is not None:
            role.description = payload.description

        self.db.commit()
        self.db.refresh(role)
        return role

    def delete(self, role_id: int) -> None:
        role = self.get(role_id)
        rel = self.repo.count_relations(role_id)
        if any(v > 0 for v in rel.values()):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Role has relations and cannot be deleted", "relations": rel},
            )

        self.repo.delete(role)
        self.db.commit()

