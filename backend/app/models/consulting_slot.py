from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ConsultingSlotStatus
from app.models.mixins import IdPkMixin, PublicUuidMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User


class ConsultingSlot(Base, IdPkMixin, PublicUuidMixin, TimestampMixin):
    """A single bookable time slot for a QA-consulting session — the
    in-house replacement for an external scheduling tool (Calendly-style),
    built directly on the platform so booking a session reuses the same
    auth, email, and admin-permission plumbing as everything else instead
    of depending on a third-party service. An admin creates `open` slots
    (usually in a batch for a week/day); any authenticated user can claim
    one, which sends a confirmation email to both sides and moves it to
    `booked`. Cancelling a booking resets the slot back to `open` — see
    ConsultingSlotStatus's docstring for why that's a separate state from
    `cancelled` (which is reserved for slots the admin pulls entirely)."""

    __tablename__ = "consulting_slots"

    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=30)

    status: Mapped[ConsultingSlotStatus] = mapped_column(
        Enum(ConsultingSlotStatus, name="consulting_slot_status", native_enum=True),
        nullable=False,
        default=ConsultingSlotStatus.open,
        index=True,
    )

    created_by_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True,
    )
    booked_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    booked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # What the client wrote when booking — e.g. "we'd like to cover our
    # CI flakiness backlog" — shown to the admin alongside the booking.
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_by_admin: Mapped["User | None"] = relationship(foreign_keys=[created_by_admin_id])
    booked_by_user: Mapped["User | None"] = relationship(foreign_keys=[booked_by_user_id])

    def __repr__(self) -> str:  # pragma: no cover - debug helper
        return f"<ConsultingSlot id={self.id} starts_at={self.starts_at.isoformat()} status={self.status.value}>"
