from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, LargeBinary, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import CreatorStatus, UserStatus
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.audit_log import AuditLog
    from app.models.course import Course
    from app.models.course_enrollment import CourseEnrollment
    from app.models.invitation import Invitation
    from app.models.organization import Organization
    from app.models.organization_member import OrganizationMember


class User(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    first_name: Mapped[str | None] = mapped_column(String(100))
    last_name: Mapped[str | None] = mapped_column(String(100))
    display_name: Mapped[str | None] = mapped_column(String(150))
    avatar_url: Mapped[str | None] = mapped_column(String(2048))
    avatar_data: Mapped[bytes | None] = mapped_column(LargeBinary, nullable=True)
    avatar_mime: Mapped[str | None] = mapped_column(String(64))

    phone_e164: Mapped[str | None] = mapped_column(String(20), unique=True, index=True)
    phone_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    two_factor_secret: Mapped[str | None] = mapped_column(Text, nullable=True)
    two_factor_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    two_factor_recovery_codes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    can_create_content: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    creator_status: Mapped[CreatorStatus] = mapped_column(
        Enum(CreatorStatus, name="creator_status", native_enum=True),
        nullable=False,
        default=CreatorStatus.none,
    )

    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status", native_enum=True),
        nullable=False,
        default=UserStatus.active,
    )

    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    security_onboarding_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    security_warning_dismissed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    security_warning_count: Mapped[int] = mapped_column(nullable=False, default=0, server_default="0")

    owned_organizations: Mapped[list["Organization"]] = relationship(
        back_populates="owner",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )

    memberships: Mapped[list["OrganizationMember"]] = relationship(
        back_populates="user",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )

    owned_courses: Mapped[list["Course"]] = relationship(back_populates="owner_user")
    course_enrollments: Mapped[list["CourseEnrollment"]] = relationship(back_populates="user")

    sent_invitations: Mapped[list["Invitation"]] = relationship(back_populates="invited_by_user")

    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="actor_user")

    def __repr__(self) -> str:
        return f"<User id={self.id} uuid={self.uuid} email={self.email!r} status={self.status.value}>"

