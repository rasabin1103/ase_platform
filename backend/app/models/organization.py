from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import OrganizationStatus, OrganizationType
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization_member import OrganizationMember
    from app.models.course import Course
    from app.models.invitation import Invitation
    from app.models.subscription import Subscription
    from app.models.audit_log import AuditLog
    from app.models.user import User


class Organization(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    __tablename__ = "organizations"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)

    type: Mapped[OrganizationType] = mapped_column(
        Enum(OrganizationType, name="organization_type", native_enum=True),
        nullable=False,
        default=OrganizationType.business,
    )

    owner_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    status: Mapped[OrganizationStatus] = mapped_column(
        Enum(OrganizationStatus, name="organization_status", native_enum=True),
        nullable=False,
        default=OrganizationStatus.active,
    )

    owner: Mapped["User"] = relationship(back_populates="owned_organizations")
    members: Mapped[list["OrganizationMember"]] = relationship(
        back_populates="organization",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )

    subscriptions: Mapped[list["Subscription"]] = relationship(
        back_populates="organization",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )

    courses: Mapped[list["Course"]] = relationship(
        back_populates="organization",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )

    invitations: Mapped[list["Invitation"]] = relationship(
        back_populates="organization",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )

    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="organization")

    def __repr__(self) -> str:
        return f"<Organization id={self.id} uuid={self.uuid} slug={self.slug!r} status={self.status.value}>"

