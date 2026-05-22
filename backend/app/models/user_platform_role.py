from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdPkMixin

if TYPE_CHECKING:
    from app.models.role import Role
    from app.models.user import User


class UserPlatformRole(Base, IdPkMixin):
    """Platform-scoped role for a user without organization membership (e.g. independent_user)."""

    __tablename__ = "user_platform_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id", name="uq_user_platform_role_pair"),)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    assigned_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    role: Mapped["Role"] = relationship()
    assigned_by_user: Mapped["User"] = relationship(foreign_keys=[assigned_by_user_id])
