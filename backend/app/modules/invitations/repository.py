from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.invitation import Invitation
from app.models.enums import InvitationStatus
from app.models.organization import Organization
from app.models.role import Role
from app.models.user import User


class InvitationsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, invitation_id: int) -> Invitation | None:
        stmt = select(Invitation).where(Invitation.id == invitation_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_token(self, token: str) -> Invitation | None:
        stmt = select(Invitation).where(Invitation.token == token)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_organization_id(self, *, organization_id: int | None, organization_uuid: UUID | None) -> int | None:
        if organization_id is not None:
            return organization_id
        if organization_uuid is None:
            return None
        stmt = select(Organization.id).where(Organization.uuid == organization_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_user_id(self, *, user_id: int | None, user_uuid: UUID | None) -> int | None:
        if user_id is not None:
            return user_id
        if user_uuid is None:
            return None
        stmt = select(User.id).where(User.uuid == user_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def organization_exists(self, organization_id: int) -> bool:
        stmt = select(func.count()).select_from(Organization).where(Organization.id == organization_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def role_exists(self, role_id: int) -> bool:
        stmt = select(func.count()).select_from(Role).where(Role.id == role_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def user_exists(self, user_id: int) -> bool:
        stmt = select(func.count()).select_from(User).where(User.id == user_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None = None,
        email: str | None = None,
        status: InvitationStatus | None = None,
    ) -> tuple[list[Invitation], int]:
        base = select(Invitation)
        if organization_id is not None:
            base = base.where(Invitation.organization_id == organization_id)
        if email is not None:
            base = base.where(Invitation.email == email)
        if status is not None:
            base = base.where(Invitation.status == status)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(Invitation.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, inv: Invitation) -> Invitation:
        self.db.add(inv)
        self.db.flush()
        return inv

