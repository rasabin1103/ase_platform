from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.course import Course
from app.models.course_enrollment import CourseEnrollment
from app.models.enums import EnrollmentStatus
from app.models.user import User


class CourseEnrollmentsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, course_enrollment_id: int) -> CourseEnrollment | None:
        stmt = select(CourseEnrollment).where(CourseEnrollment.id == course_enrollment_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def course_exists(self, course_id: int) -> bool:
        stmt = select(func.count()).select_from(Course).where(Course.id == course_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def get_course_organization_id(self, course_id: int) -> int | None:
        stmt = select(Course.organization_id).where(Course.id == course_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_user_id(self, *, user_id: int | None, user_uuid: UUID | None) -> int | None:
        if user_id is not None:
            return user_id
        if user_uuid is None:
            return None
        stmt = select(User.id).where(User.uuid == user_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def user_exists(self, user_id: int) -> bool:
        stmt = select(func.count()).select_from(User).where(User.id == user_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def get_by_pair(self, *, course_id: int, user_id: int) -> CourseEnrollment | None:
        stmt = select(CourseEnrollment).where(CourseEnrollment.course_id == course_id, CourseEnrollment.user_id == user_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        course_id: int | None = None,
        user_id: int | None = None,
        status: EnrollmentStatus | None = None,
        organization_id: int | None = None,
    ) -> tuple[list[CourseEnrollment], int]:
        base = select(CourseEnrollment)
        if organization_id is not None:
            base = base.join(Course, Course.id == CourseEnrollment.course_id).where(Course.organization_id == organization_id)
        if course_id is not None:
            base = base.where(CourseEnrollment.course_id == course_id)
        if user_id is not None:
            base = base.where(CourseEnrollment.user_id == user_id)
        if status is not None:
            base = base.where(CourseEnrollment.status == status)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(CourseEnrollment.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, ce: CourseEnrollment) -> CourseEnrollment:
        self.db.add(ce)
        self.db.flush()
        return ce

