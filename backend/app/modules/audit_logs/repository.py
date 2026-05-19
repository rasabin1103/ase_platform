from __future__ import annotations

from uuid import UUID

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.audit_log import AuditLog
from app.models.organization import Organization
from app.models.user import User


class AuditLogsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, audit_log_id: int) -> AuditLog | None:
        stmt = select(AuditLog).where(AuditLog.id == audit_log_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def organization_exists(self, organization_id: int) -> bool:
        stmt = select(func.count()).select_from(Organization).where(Organization.id == organization_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def user_exists(self, user_id: int) -> bool:
        stmt = select(func.count()).select_from(User).where(User.id == user_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

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

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None = None,
        actor_user_id: int | None = None,
        entity_type: str | None = None,
        action: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[AuditLog], int]:
        base = select(AuditLog)
        if organization_id is not None:
            base = base.where(AuditLog.organization_id == organization_id)
        if actor_user_id is not None:
            base = base.where(AuditLog.actor_user_id == actor_user_id)
        if entity_type is not None:
            base = base.where(AuditLog.entity_type == entity_type)
        if action is not None:
            base = base.where(AuditLog.action == action)
        if date_from is not None:
            base = base.where(AuditLog.created_at >= date_from)
        if date_to is not None:
            base = base.where(AuditLog.created_at <= date_to)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = (
            base.options(selectinload(AuditLog.organization), selectinload(AuditLog.actor_user))
            .order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
            .limit(limit)
            .offset(offset)
        )
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        self.db.flush()
        return log

