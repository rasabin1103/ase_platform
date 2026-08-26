from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_active_user, require_permission
from app.modules.booking.schemas import (
    ConsultingBookingCreate,
    ConsultingSlotAdminListResponse,
    ConsultingSlotAdminRead,
    ConsultingSlotBatchCreate,
    ConsultingSlotListResponse,
    ConsultingSlotRead,
    MyBookingListResponse,
)
from app.modules.booking.service import BookingError, BookingService

# Same rationale as blog_admin/catalog_admin: this platform runs in MVP mode
# with only super_admin / independent_user roles, and require_permission()
# bypasses the specific code entirely for super_admin, so reusing
# "catalog.manage" here is equivalent to a dedicated "booking.manage" code.
_MANAGE = Depends(require_permission("catalog.manage"))

admin_router = APIRouter(prefix="/api/v1/admin/booking", tags=["booking-admin"])
router = APIRouter(prefix="/api/v1/booking", tags=["booking"])


def get_service(db: Session = Depends(get_db)) -> BookingService:
    return BookingService(db)


def _to_admin_read(slot) -> ConsultingSlotAdminRead:
    booked_by_name = None
    booked_by_email = None
    if slot.booked_by_user is not None:
        booked_by_name = (slot.booked_by_user.first_name or "").strip() or None
        booked_by_email = slot.booked_by_user.email
    return ConsultingSlotAdminRead(
        uuid=slot.uuid,
        starts_at=slot.starts_at,
        duration_minutes=slot.duration_minutes,
        status=slot.status.value,
        notes=slot.notes,
        booked_by_user_id=slot.booked_by_user_id,
        booked_by_name=booked_by_name,
        booked_by_email=booked_by_email,
        booked_at=slot.booked_at,
    )


# --- Admin: manage availability -----------------------------------------


@admin_router.get("/slots", response_model=ConsultingSlotAdminListResponse, dependencies=[_MANAGE])
def admin_list_slots(svc: BookingService = Depends(get_service)):
    slots = svc.admin_list_slots()
    return ConsultingSlotAdminListResponse(items=[_to_admin_read(s) for s in slots])


@admin_router.post("/slots", response_model=ConsultingSlotAdminListResponse, dependencies=[_MANAGE])
def admin_create_slots(
    payload: ConsultingSlotBatchCreate,
    current_user: User = Depends(get_current_active_user),
    svc: BookingService = Depends(get_service),
):
    slots = svc.admin_create_slots(
        admin=current_user,
        payload_starts_at=payload.starts_at_list,
        duration_minutes=payload.duration_minutes,
    )
    return ConsultingSlotAdminListResponse(items=[_to_admin_read(s) for s in slots])


@admin_router.delete("/slots/{slot_uuid}", dependencies=[_MANAGE])
def admin_delete_slot(slot_uuid: str, svc: BookingService = Depends(get_service)):
    try:
        svc.admin_delete_slot(slot_uuid=slot_uuid)
    except BookingError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return {"ok": True}


# --- Client: browse + book ------------------------------------------------


@router.get("/slots", response_model=ConsultingSlotListResponse)
def list_available_slots(
    current_user: User = Depends(get_current_active_user),
    svc: BookingService = Depends(get_service),
):
    slots = svc.list_available_slots()
    return ConsultingSlotListResponse(
        items=[
            ConsultingSlotRead(
                uuid=s.uuid, starts_at=s.starts_at, duration_minutes=s.duration_minutes,
                status=s.status.value, notes=None,
            )
            for s in slots
        ]
    )


@router.post("/slots/{slot_uuid}/book", response_model=ConsultingSlotRead)
def book_slot(
    slot_uuid: str,
    payload: ConsultingBookingCreate,
    current_user: User = Depends(get_current_active_user),
    svc: BookingService = Depends(get_service),
):
    try:
        slot = svc.book_slot(slot_uuid=slot_uuid, current_user=current_user, notes=payload.notes)
    except BookingError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return ConsultingSlotRead(
        uuid=slot.uuid, starts_at=slot.starts_at, duration_minutes=slot.duration_minutes,
        status=slot.status.value, notes=slot.notes,
    )


@router.get("/my-bookings", response_model=MyBookingListResponse)
def list_my_bookings(
    current_user: User = Depends(get_current_active_user),
    svc: BookingService = Depends(get_service),
):
    slots = svc.list_my_bookings(current_user=current_user)
    return MyBookingListResponse(
        items=[
            {
                "uuid": s.uuid, "starts_at": s.starts_at, "duration_minutes": s.duration_minutes,
                "status": s.status.value, "notes": s.notes,
            }
            for s in slots
        ]
    )


@router.post("/my-bookings/{slot_uuid}/cancel", response_model=ConsultingSlotRead)
def cancel_my_booking(
    slot_uuid: str,
    current_user: User = Depends(get_current_active_user),
    svc: BookingService = Depends(get_service),
):
    try:
        slot = svc.cancel_my_booking(slot_uuid=slot_uuid, current_user=current_user)
    except BookingError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return ConsultingSlotRead(
        uuid=slot.uuid, starts_at=slot.starts_at, duration_minutes=slot.duration_minutes,
        status=slot.status.value, notes=slot.notes,
    )
