from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.course_enrollment import CourseEnrollment
from app.models.enums import EnrollmentStatus
from app.modules.course_enrollments.repository import CourseEnrollmentsRepository
from app.modules.course_enrollments.schemas import CourseEnrollmentCreate, CourseEnrollmentUpdate


class CourseEnrollmentsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CourseEnrollmentsRepository(db)

    def _validate_completed_at(self, status_value: EnrollmentStatus, completed_at: datetime | None) -> datetime | None:
        if status_value == EnrollmentStatus.completed:
            return completed_at or datetime.now(timezone.utc)
        if completed_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="completed_at can only be set when status is completed",
            )
        return None

    def create(self, payload: CourseEnrollmentCreate) -> CourseEnrollment:
        if not self.repo.course_exists(payload.course_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Course not found")

        user_id = self.repo.get_user_id(user_id=payload.user_id, user_uuid=payload.user_uuid)
        if user_id is None or not self.repo.user_exists(user_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User not found")

        if self.repo.get_by_pair(course_id=payload.course_id, user_id=user_id) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already enrolled in this course")

        completed_at = self._validate_completed_at(payload.status, payload.completed_at)

        ce = CourseEnrollment(
            course_id=payload.course_id,
            user_id=user_id,
            status=payload.status,
            completed_at=completed_at,
        )
        try:
            self.repo.add(ce)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate enrollment for course")

        self.db.refresh(ce)
        return ce

    def list(
        self,
        *,
        limit: int,
        offset: int,
        course_id: int | None,
        user_id: int | None,
        status_filter: EnrollmentStatus | None,
        organization_id: int | None = None,
    ) -> tuple[list[CourseEnrollment], int]:
        return self.repo.list(
            limit=limit,
            offset=offset,
            course_id=course_id,
            user_id=user_id,
            status=status_filter,
            organization_id=organization_id,
        )

    def get(self, course_enrollment_id: int) -> CourseEnrollment:
        ce = self.repo.get(course_enrollment_id)
        if ce is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course enrollment not found")
        return ce

    def update(self, course_enrollment_id: int, payload: CourseEnrollmentUpdate) -> CourseEnrollment:
        ce = self.get(course_enrollment_id)
        fields_set = payload.model_fields_set

        new_status = payload.status if payload.status is not None else ce.status
        new_completed_at = payload.completed_at if "completed_at" in fields_set else ce.completed_at

        ce.status = new_status
        ce.completed_at = self._validate_completed_at(new_status, new_completed_at)

        self.db.commit()
        self.db.refresh(ce)
        return ce

    def cancel(self, course_enrollment_id: int) -> CourseEnrollment:
        ce = self.get(course_enrollment_id)
        ce.status = EnrollmentStatus.canceled
        ce.completed_at = None
        self.db.commit()
        self.db.refresh(ce)
        return ce

