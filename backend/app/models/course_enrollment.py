from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import EnrollmentStatus
from app.models.mixins import IdPkMixin

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.user import User


class CourseEnrollment(Base, IdPkMixin):
    __tablename__ = "course_enrollments"
    __table_args__ = (UniqueConstraint("course_id", "user_id", name="uq_course_enrollment_course_user"),)

    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    status: Mapped[EnrollmentStatus] = mapped_column(
        Enum(EnrollmentStatus, name="enrollment_status", native_enum=True),
        nullable=False,
        default=EnrollmentStatus.active,
        index=True,
    )

    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    course: Mapped["Course"] = relationship(back_populates="enrollments")
    user: Mapped["User"] = relationship(back_populates="course_enrollments")

    def __repr__(self) -> str:
        return (
            f"<CourseEnrollment id={self.id} course_id={self.course_id} user_id={self.user_id} "
            f"status={self.status.value}>"
        )

