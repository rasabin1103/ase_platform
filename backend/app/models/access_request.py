from __future__ import annotations

import uuid as _uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AccessRequestPriority, AccessRequestStatus, AccessRequestType
from app.models.mixins import IdPkMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class AccessRequest(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "access_requests"

    uuid: Mapped[_uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        index=True,
        default=_uuid.uuid4,
        nullable=False,
    )
    organization_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    requested_by_user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reviewed_by_user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    request_type: Mapped[AccessRequestType] = mapped_column(
        Enum(AccessRequestType, name="access_request_type", native_enum=True),
        nullable=False,
        index=True,
    )
    target_entity_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_entity_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[AccessRequestStatus] = mapped_column(
        Enum(AccessRequestStatus, name="access_request_status", native_enum=True),
        nullable=False,
        default=AccessRequestStatus.pending,
        index=True,
    )
    priority: Mapped[AccessRequestPriority] = mapped_column(
        Enum(AccessRequestPriority, name="access_request_priority", native_enum=True),
        nullable=False,
        default=AccessRequestPriority.normal,
    )
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(Text)

    organization: Mapped["Organization | None"] = relationship()
    requested_by_user: Mapped["User"] = relationship(foreign_keys=[requested_by_user_id])
    reviewed_by_user: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by_user_id])

    def __repr__(self) -> str:
        return f"<AccessRequest id={self.id} status={self.status.value}>"
