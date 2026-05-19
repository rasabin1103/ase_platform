from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import CourseStatus
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.course_enrollment import CourseEnrollment
    from app.models.organization import Organization
    from app.models.user import User


class Course(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "courses"
    __table_args__ = (
        # Exactly one owner: either an organization OR an owner user.
        CheckConstraint(
            "(organization_id IS NULL) <> (owner_user_id IS NULL)",
            name="ck_courses_exactly_one_owner",
        ),
    )

    organization_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
    )
    owner_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(150), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    cover_image_url: Mapped[str | None] = mapped_column(String(2048))
    category: Mapped[str | None] = mapped_column(String(80), index=True)

    status: Mapped[CourseStatus] = mapped_column(
        Enum(CourseStatus, name="course_status", native_enum=True),
        nullable=False,
        default=CourseStatus.draft,
        index=True,
    )

    organization: Mapped["Organization | None"] = relationship(back_populates="courses")
    owner_user: Mapped["User | None"] = relationship(back_populates="owned_courses")

    enrollments: Mapped[list["CourseEnrollment"]] = relationship(
        back_populates="course",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return f"<Course id={self.id} slug={self.slug!r} status={self.status.value}>"

