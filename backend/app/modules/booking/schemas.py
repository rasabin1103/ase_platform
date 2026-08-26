from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ConsultingSlotRead(BaseModel):
    """A single bookable/booked QA-consulting slot. `booked_by_*` fields are
    only populated for the admin's own view (see the two response models
    below) — the public "available slots" list never exposes who booked
    what, since that would leak another client's identity."""

    uuid: UUID
    starts_at: datetime
    duration_minutes: int
    status: str
    notes: str | None = None

    model_config = {"from_attributes": True}


class ConsultingSlotAdminRead(ConsultingSlotRead):
    """Same slot, with the booking client's identity attached — admin-only."""

    booked_by_user_id: int | None = None
    booked_by_name: str | None = None
    booked_by_email: str | None = None
    booked_at: datetime | None = None


class ConsultingSlotListResponse(BaseModel):
    items: list[ConsultingSlotRead]


class ConsultingSlotAdminListResponse(BaseModel):
    items: list[ConsultingSlotAdminRead]


class ConsultingSlotBatchCreate(BaseModel):
    """Bulk slot creation — an admin usually opens a whole week/day of
    evenly-spaced slots in one call rather than one at a time."""

    starts_at_list: list[datetime] = Field(min_length=1, max_length=200)
    duration_minutes: int = Field(default=30, ge=15, le=240)


class ConsultingBookingCreate(BaseModel):
    notes: str | None = Field(default=None, max_length=2000)


class MyBookingRead(BaseModel):
    uuid: UUID
    starts_at: datetime
    duration_minutes: int
    status: str
    notes: str | None = None

    model_config = {"from_attributes": True}


class MyBookingListResponse(BaseModel):
    items: list[MyBookingRead]
