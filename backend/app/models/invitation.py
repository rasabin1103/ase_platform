from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import InvitationStatus
from app.models.mixins import IdPkMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.role import Role
    from app.models.user import User


class Invitation(Base, IdPkMixin):
    __tablename__ = "invitations"

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    email: Mapped[str] = mapped_column(String(320), index=True, nullable=False)

    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)

    status: Mapped[InvitationStatus] = mapped_column(
        Enum(InvitationStatus, name="invitation_status", native_enum=True),
        nullable=False,
        default=InvitationStatus.pending,
        index=True,
    )

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    invited_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    organization: Mapped["Organization"] = relationship(back_populates="invitations")
    role: Mapped["Role"] = relationship(back_populates="invitations")
    invited_by_user: Mapped["User"] = relationship(back_populates="sent_invitations")

    def __repr__(self) -> str:
        return f"<Invitation id={self.id} org_id={self.organization_id} email={self.email!r} status={self.status.value}>"

