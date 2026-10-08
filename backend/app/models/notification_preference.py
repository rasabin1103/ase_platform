from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin


class NotificationPreference(Base, IdPkMixin, TimestampMixin):
    """One row per user, created lazily the first time they change a
    setting. No row = defaults (every category on in-app, email off, no
    digest, not muted) — see app.modules.notifications.service.

    `categories` maps a category key (app.core.notification_categories) to
    {"in_app": bool, "email": bool}; categories missing from it use the
    default. `muted_until` is a global do-not-disturb: while it's in the
    future no optional notification is created for the user at all."""

    __tablename__ = "notification_preferences"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False,
    )
    muted_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # off = one email per sweep with whatever is new; daily / weekly = a
    # single summary email per period instead.
    digest_frequency: Mapped[str] = mapped_column(String(10), nullable=False, default="off", server_default="off")
    last_digest_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    categories: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict, server_default="{}")
