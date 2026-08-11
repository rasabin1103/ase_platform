from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import OrganizationJoinRequestStatus
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class OrganizationJoinRequest(Base, IdPkMixin, TimestampMixin):
    """A request from a user with no active organization membership asking
    to join a specific organization. Only the organization's owner may
    approve or reject it."""

    __tablename__ = "organization_join_requests"

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False,
    )
    status: Mapped[OrganizationJoinRequestStatus] = mapped_column(
        Enum(OrganizationJoinRequestStatus, name="organization_join_request_status", native_enum=True),
        nullable=False,
        default=OrganizationJoinRequestStatus.pending,
        index=True,
    )
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped["Organization"] = relationship(foreign_keys=[organization_id])
    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    reviewed_by_user: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by_user_id])

    def __repr__(self) -> str:
        return f"<OrganizationJoinRequest id={self.id} org_id={self.organization_id} user_id={self.user_id} status={self.status.value}>"
