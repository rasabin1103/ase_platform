from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import MembershipStatus
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.member_role import MemberRole
    from app.models.organization import Organization
    from app.models.user import User


class OrganizationMember(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "organization_members"
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_org_member_org_user"),
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    membership_status: Mapped[MembershipStatus] = mapped_column(
        Enum(MembershipStatus, name="membership_status", native_enum=True),
        nullable=False,
        default=MembershipStatus.invited,
    )

    joined_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    organization: Mapped["Organization"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="memberships")

    roles: Mapped[list["MemberRole"]] = relationship(
        back_populates="organization_member",
        cascade="all,delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return (
            f"<OrganizationMember id={self.id} organization_id={self.organization_id} "
            f"user_id={self.user_id} status={self.membership_status.value}>"
        )

