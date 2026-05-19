from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.member_role import MemberRole
from app.modules.member_roles.repository import MemberRolesRepository
from app.modules.member_roles.schemas import MemberRoleCreate


class MemberRolesService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = MemberRolesRepository(db)

    def create(self, payload: MemberRoleCreate) -> MemberRole:
        if not self.repo.org_member_exists(payload.organization_member_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization member not found")
        if not self.repo.role_exists(payload.role_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role not found")

        assigned_by_user_id = self.repo.get_assigned_by_user_id(
            assigned_by_user_id=payload.assigned_by_user_id,
            assigned_by_user_uuid=payload.assigned_by_user_uuid,
        )
        if assigned_by_user_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assigned by user not found")

        if (
            self.repo.get_by_pair(organization_member_id=payload.organization_member_id, role_id=payload.role_id)
            is not None
        ):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Member role already exists")

        mr = MemberRole(
            organization_member_id=payload.organization_member_id,
            role_id=payload.role_id,
            assigned_by_user_id=assigned_by_user_id,
        )
        try:
            self.repo.add(mr)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Member role already exists")

        self.db.refresh(mr)
        return mr

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_member_id: int | None = None,
        role_id: int | None = None,
    ) -> tuple[list[MemberRole], int]:
        return self.repo.list(
            limit=limit, offset=offset, organization_member_id=organization_member_id, role_id=role_id
        )

    def get(self, member_role_id: int) -> MemberRole:
        mr = self.repo.get(member_role_id)
        if mr is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member role not found")
        return mr

    def delete(self, member_role_id: int) -> None:
        mr = self.get(member_role_id)
        self.repo.delete(mr)
        self.db.commit()

