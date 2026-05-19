from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import ResourceAssignmentStatus
from app.models.resource_assignment import ResourceAssignment
from app.modules.resource_assignments.repository import ResourceAssignmentsRepository
from app.modules.resource_assignments.schemas import (
    ResourceAssignmentCreate,
    ResourceAssignmentRead,
    ResourceAssignmentUpdate,
)


class ResourceAssignmentsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ResourceAssignmentsRepository(db)

    def create(self, payload: ResourceAssignmentCreate, *, assigned_by_user_id: int) -> ResourceAssignmentRead:
        item = ResourceAssignment(
            organization_id=payload.organization_id,
            resource_type=payload.resource_type,
            resource_id=payload.resource_id,
            assigned_to_user_id=payload.assigned_to_user_id,
            assigned_by_user_id=assigned_by_user_id,
            status=ResourceAssignmentStatus.active,
            starts_at=payload.starts_at,
            ends_at=payload.ends_at,
        )
        self.repo.add(item)
        self.db.commit()
        self.db.refresh(item)
        return ResourceAssignmentRead.model_validate(item)

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None = None,
        assigned_to_user_id: int | None = None,
        resource_type: str | None = None,
    ) -> tuple[list[ResourceAssignmentRead], int]:
        items, total = self.repo.list(
            limit=limit,
            offset=offset,
            organization_id=organization_id,
            assigned_to_user_id=assigned_to_user_id,
            resource_type=resource_type,
        )
        return [ResourceAssignmentRead.model_validate(i) for i in items], total

    def get(self, assignment_id: int) -> ResourceAssignmentRead:
        item = self.repo.get(assignment_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        return ResourceAssignmentRead.model_validate(item)

    def update(self, assignment_id: int, payload: ResourceAssignmentUpdate) -> ResourceAssignmentRead:
        item = self.repo.get(assignment_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        self.db.commit()
        self.db.refresh(item)
        return ResourceAssignmentRead.model_validate(item)
