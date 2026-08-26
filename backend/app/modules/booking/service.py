from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import send_email
from app.core.email_templates import booking_cancelled_email, booking_confirmed_email
from app.models.consulting_slot import ConsultingSlot
from app.models.enums import ConsultingSlotStatus
from app.models.user import User


def _starts_at_label(dt: datetime, language: str) -> str:
    """Human-readable date/time for email bodies — DateTime(timezone=True)
    columns come back tz-aware from Postgres, so this just formats it,
    no conversion (the platform doesn't yet track per-user timezone)."""
    fmt = "%d/%m/%Y %H:%M" if language != "en" else "%m/%d/%Y %H:%M UTC"
    return dt.strftime(fmt)


class BookingError(Exception):
    """Raised for booking-flow failures the router turns into HTTP 400/404/409."""


class BookingService:
    """In-house replacement for an external scheduling tool: an admin opens
    `open` slots, any authenticated user can claim one (moving it to
    `booked`), and cancelling a booking frees the slot back to `open`. No
    third-party dependency — confirmation emails reuse the existing SMTP
    email system (see app/core/email_templates.py)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # --- Admin: manage availability ---------------------------------

    def admin_create_slots(self, *, admin: User, payload_starts_at: list[datetime], duration_minutes: int) -> list[ConsultingSlot]:
        created: list[ConsultingSlot] = []
        for starts_at in payload_starts_at:
            slot = ConsultingSlot(
                starts_at=starts_at,
                duration_minutes=duration_minutes,
                status=ConsultingSlotStatus.open,
                created_by_admin_id=admin.id,
            )
            self.db.add(slot)
            created.append(slot)
        self.db.commit()
        for slot in created:
            self.db.refresh(slot)
        return created

    def admin_list_slots(self, *, upcoming_only: bool = False) -> list[ConsultingSlot]:
        stmt = select(ConsultingSlot).order_by(ConsultingSlot.starts_at.asc())
        if upcoming_only:
            stmt = stmt.where(ConsultingSlot.starts_at >= datetime.now(timezone.utc))
        return list(self.db.execute(stmt).scalars().all())

    def admin_delete_slot(self, *, slot_uuid: str) -> None:
        slot = self._get_by_uuid(slot_uuid)
        if slot.status == ConsultingSlotStatus.booked:
            raise BookingError("No se puede eliminar una franja ya reservada; cancela la reserva primero.")
        self.db.delete(slot)
        self.db.commit()

    # --- Client: browse + book ---------------------------------------

    def list_available_slots(self) -> list[ConsultingSlot]:
        stmt = (
            select(ConsultingSlot)
            .where(
                ConsultingSlot.status == ConsultingSlotStatus.open,
                ConsultingSlot.starts_at >= datetime.now(timezone.utc),
            )
            .order_by(ConsultingSlot.starts_at.asc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def book_slot(self, *, slot_uuid: str, current_user: User, notes: str | None) -> ConsultingSlot:
        slot = self._get_by_uuid(slot_uuid)
        if slot.status != ConsultingSlotStatus.open:
            raise BookingError("Esta franja ya no está disponible.")
        if slot.starts_at < datetime.now(timezone.utc):
            raise BookingError("Esta franja ya ha pasado.")

        slot.status = ConsultingSlotStatus.booked
        slot.booked_by_user_id = current_user.id
        slot.booked_at = datetime.now(timezone.utc)
        slot.notes = notes
        self.db.commit()
        self.db.refresh(slot)

        self._send_booking_confirmed_emails(slot=slot, client=current_user)
        return slot

    def list_my_bookings(self, *, current_user: User) -> list[ConsultingSlot]:
        stmt = (
            select(ConsultingSlot)
            .where(ConsultingSlot.booked_by_user_id == current_user.id)
            .order_by(ConsultingSlot.starts_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def cancel_my_booking(self, *, slot_uuid: str, current_user: User) -> ConsultingSlot:
        slot = self._get_by_uuid(slot_uuid)
        if slot.booked_by_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva no encontrada.")
        if slot.status != ConsultingSlotStatus.booked:
            raise BookingError("Esta reserva ya no está activa.")

        starts_at_label = _starts_at_label(slot.starts_at, current_user.preferred_language)
        slot.status = ConsultingSlotStatus.open
        slot.booked_by_user_id = None
        slot.booked_at = None
        slot.notes = None
        self.db.commit()
        self.db.refresh(slot)

        html, text = booking_cancelled_email(
            f"{settings.FRONTEND_URL}/booking",
            starts_at_label=starts_at_label,
            language=current_user.preferred_language,
        )
        send_email(
            to_email=current_user.email,
            subject="Tu sesión ha sido cancelada" if current_user.preferred_language != "en" else "Your session was cancelled",
            html_body=html,
            text_body=text,
        )
        return slot

    # --- internal ------------------------------------------------------

    def _get_by_uuid(self, slot_uuid: str) -> ConsultingSlot:
        slot = self.db.execute(select(ConsultingSlot).where(ConsultingSlot.uuid == slot_uuid)).scalar_one_or_none()
        if slot is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Franja no encontrada.")
        return slot

    def _send_booking_confirmed_emails(self, *, slot: ConsultingSlot, client: User) -> None:
        client_label = _starts_at_label(slot.starts_at, client.preferred_language)
        client_name = (client.first_name or client.email).strip()

        html, text = booking_confirmed_email(
            f"{settings.FRONTEND_URL}/booking",
            starts_at_label=client_label,
            duration_minutes=slot.duration_minutes,
            notes=slot.notes,
            language=client.preferred_language,
        )
        send_email(
            to_email=client.email,
            subject="Tu sesión está confirmada" if client.preferred_language != "en" else "Your session is confirmed",
            html_body=html,
            text_body=text,
        )

        admin_label = _starts_at_label(slot.starts_at, "es")
        admin_html, admin_text = booking_confirmed_email(
            f"{settings.FRONTEND_URL}/admin/booking",
            starts_at_label=admin_label,
            duration_minutes=slot.duration_minutes,
            is_admin_copy=True,
            counterpart_label=f"{client_name} ({client.email})",
            notes=slot.notes,
            language="es",
        )
        send_email(
            to_email=settings.SMTP_FROM_EMAIL,
            subject="Sesión de consultoría reservada",
            html_body=admin_html,
            text_body=admin_text,
        )
