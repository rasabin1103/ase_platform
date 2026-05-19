from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdPkMixin

if TYPE_CHECKING:
    from app.models.organization_member import OrganizationMember
    from app.models.role import Role
    from app.models.user import User


class MemberRole(Base, IdPkMixin):
    __tablename__ = "member_roles"
    __table_args__ = (UniqueConstraint("organization_member_id", "role_id", name="uq_member_role_pair"),)

    organization_member_id: Mapped[int] = mapped_column(
        ForeignKey("organization_members.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    assigned_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        index=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    organization_member: Mapped["OrganizationMember"] = relationship(back_populates="roles")
    role: Mapped["Role"] = relationship(back_populates="member_assignments")
    assigned_by_user: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return (
            f"<MemberRole id={self.id} organization_member_id={self.organization_member_id} "
            f"role_id={self.role_id} assigned_by_user_id={self.assigned_by_user_id}>"
        )

