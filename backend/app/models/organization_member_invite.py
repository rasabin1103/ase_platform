from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import OrganizationMemberInviteStatus
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class OrganizationMemberInvite(Base, IdPkMixin, TimestampMixin):
    """An in-app invite from an organization to an existing platform user
    who currently has no active organization membership. The invited user
    must accept it before an ``OrganizationMember`` row is created."""

    __tablename__ = "organization_member_invites"

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    invited_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    invited_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False,
    )
    status: Mapped[OrganizationMemberInviteStatus] = mapped_column(
        Enum(OrganizationMemberInviteStatus, name="organization_member_invite_status", native_enum=True),
        nullable=False,
        default=OrganizationMemberInviteStatus.pending,
        index=True,
    )
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped["Organization"] = relationship(foreign_keys=[organization_id])
    invited_user: Mapped["User"] = relationship(foreign_keys=[invited_user_id])
    invited_by_user: Mapped["User"] = relationship(foreign_keys=[invited_by_user_id])

    def __repr__(self) -> str:
        return (
            f"<OrganizationMemberInvite id={self.id} org_id={self.organization_id} "
            f"invited_user_id={self.invited_user_id} status={self.status.value}>"
        )
