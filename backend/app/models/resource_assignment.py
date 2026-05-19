from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ResourceAssignmentStatus
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class ResourceAssignment(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "resource_assignments"

    organization_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    assigned_to_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assigned_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[ResourceAssignmentStatus] = mapped_column(
        Enum(ResourceAssignmentStatus, name="resource_assignment_status", native_enum=True),
        nullable=False,
        default=ResourceAssignmentStatus.active,
        index=True,
    )
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    organization: Mapped["Organization | None"] = relationship()
    assigned_to_user: Mapped["User"] = relationship(foreign_keys=[assigned_to_user_id])
    assigned_by_user: Mapped["User | None"] = relationship(foreign_keys=[assigned_by_user_id])

    def __repr__(self) -> str:
        return f"<ResourceAssignment id={self.id} type={self.resource_type!r}>"
