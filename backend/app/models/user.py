from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, Integer, LargeBinary, String
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
    from app.models.user_link import UserLink


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
    # Base32 TOTP secret (RFC 6238) — set as soon as the user starts setup,
    # but `two_factor_enabled` only flips to True once they confirm a valid
    # code. Never serialized in any API response; never logged.
    two_factor_secret: Mapped[str | None] = mapped_column(String(64))
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

    # Brute-force lockout — counts consecutive wrong-password attempts since
    # the last successful login (or the last unlock). Reset to 0 on a
    # successful login. Once it reaches settings.LOGIN_MAX_FAILED_ATTEMPTS,
    # locked_until is set and login is refused until it passes, regardless
    # of whether the password given afterwards is correct.
    failed_login_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Automated account-lifecycle policy (app/core/account_lifecycle.py):
    # accounts that never activate 2FA within the grace period, or go too
    # long without logging in, get suspended here — `suspension_reason`
    # distinguishes why (see SuspensionReason) so the login flow and the
    # frontend can react appropriately. Left NULL for a manual admin
    # suspension (pre-existing `status` field, unrelated to this policy).
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    suspension_reason: Mapped[str | None] = mapped_column(String(32))

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

    links: Mapped[list["UserLink"]] = relationship(
        cascade="all,delete-orphan",
        passive_deletes=True,
        order_by="UserLink.display_order",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} uuid={self.uuid} email={self.email!r} status={self.status.value}>"

