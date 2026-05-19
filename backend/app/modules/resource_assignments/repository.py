from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.resource_assignment import ResourceAssignment


class ResourceAssignmentsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, assignment_id: int) -> ResourceAssignment | None:
        return self.db.execute(
            select(ResourceAssignment).where(ResourceAssignment.id == assignment_id)
        ).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None = None,
        assigned_to_user_id: int | None = None,
        resource_type: str | None = None,
    ) -> tuple[list[ResourceAssignment], int]:
        base = select(ResourceAssignment)
        if organization_id is not None:
            base = base.where(ResourceAssignment.organization_id == organization_id)
        if assigned_to_user_id is not None:
            base = base.where(ResourceAssignment.assigned_to_user_id == assigned_to_user_id)
        if resource_type is not None:
            base = base.where(ResourceAssignment.resource_type == resource_type)

        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = (
            base.order_by(ResourceAssignment.created_at.desc(), ResourceAssignment.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.execute(stmt).scalars().all()), total

    def add(self, item: ResourceAssignment) -> ResourceAssignment:
        self.db.add(item)
        self.db.flush()
        return item
