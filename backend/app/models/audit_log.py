from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import IdPkMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User


class AuditLog(Base, IdPkMixin):
    __tablename__ = "audit_logs"

    organization_id: Mapped[int | None] = mapped_column(
        ForeignKey("organizations.id", ondelete="SET NULL"),
        index=True,
    )
    actor_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )

    action: Mapped[str] = mapped_column(String(200), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(64), index=True)

    metadata_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    organization: Mapped["Organization | None"] = relationship(back_populates="audit_logs")
    actor_user: Mapped["User | None"] = relationship(back_populates="audit_logs")

    @property
    def organization_name(self) -> str | None:
        return self.organization.name if self.organization else None

    @property
    def actor_display_name(self) -> str | None:
        if self.actor_user is None:
            return None
        return self.actor_user.display_name or " ".join(
            p for p in (self.actor_user.first_name, self.actor_user.last_name) if p
        ).strip() or self.actor_user.email

    @property
    def actor_email(self) -> str | None:
        return self.actor_user.email if self.actor_user else None

    def __repr__(self) -> str:
        return f"<AuditLog id={self.id} action={self.action!r} entity_type={self.entity_type!r} entity_id={self.entity_id!r}>"

