from __future__ import annotations

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.enums import EnrollmentStatus


class CourseEnrollmentCreate(BaseModel):
    course_id: int = Field(ge=1)
    user_id: int | None = Field(default=None, ge=1)
    user_uuid: UUID | None = None
    status: EnrollmentStatus = EnrollmentStatus.active
    completed_at: datetime | None = None


class CourseEnrollmentUpdate(BaseModel):
    status: EnrollmentStatus | None = None
    completed_at: datetime | None = None


class CourseEnrollmentRead(BaseModel):
    id: int
    course_id: int
    user_id: int
    status: EnrollmentStatus
    enrolled_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class CourseEnrollmentListResponse(BaseModel):
    items: list[CourseEnrollmentRead]
    limit: int
    offset: int
    total: int

