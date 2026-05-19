from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import CourseStatus


class CourseCreate(BaseModel):
    organization_id: int | None = Field(default=None, ge=1)
    organization_uuid: UUID | None = None
    owner_user_id: int | None = Field(default=None, ge=1)
    owner_user_uuid: UUID | None = None
    title: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=150)
    description: str | None = None
    cover_image_url: str | None = Field(default=None, max_length=2048)
    category: str | None = Field(default=None, max_length=80)
    status: CourseStatus = CourseStatus.draft


class CourseUpdate(BaseModel):
    organization_id: int | None = Field(default=None, ge=1)
    organization_uuid: UUID | None = None
    owner_user_id: int | None = Field(default=None, ge=1)
    owner_user_uuid: UUID | None = None
    title: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    cover_image_url: str | None = Field(default=None, max_length=2048)
    category: str | None = Field(default=None, max_length=80)
    status: CourseStatus | None = None


class CourseRead(BaseModel):
    id: int
    organization_id: int | None
    owner_user_id: int | None
    title: str
    slug: str
    description: str | None
    cover_image_url: str | None
    category: str | None
    status: CourseStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CourseListItemRead(CourseRead):
    enrollment_count: int = 0
    instructor_display_name: str | None = None
    instructor_email: str | None = None


class CourseListResponse(BaseModel):
    items: list[CourseListItemRead]
    limit: int
    offset: int
    total: int


class CourseStatusCount(BaseModel):
    status: CourseStatus
    count: int


class CourseTopItem(BaseModel):
    course_id: int
    title: str
    slug: str
    enrollment_count: int


class CourseRecentActivityItem(BaseModel):
    course_id: int
    title: str
    slug: str
    updated_at: datetime


class CourseEnrollmentMonthBucket(BaseModel):
    month: str
    count: int


class CourseDashboardStats(BaseModel):
    total_courses: int
    published_count: int
    draft_count: int
    archived_count: int
    total_enrollments: int
    by_status: list[CourseStatusCount]
    enrollments_by_month: list[CourseEnrollmentMonthBucket]
    top_courses: list[CourseTopItem]
    recent_activity: list[CourseRecentActivityItem]

