"""Tests for app.modules.booking — the in-house QA-consulting scheduler
(admin opens slots, any authenticated user can claim one). Booking and
cancelling both send confirmation emails via app.core.email.send_email,
which is mocked out here since SMTP is actually configured in this
project's real .env (see test_billing.py's Stripe/Turnstile equivalents) —
without the mock, every test here would attempt a real SMTP connection."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.consulting_slot import ConsultingSlot
from app.models.enums import ConsultingSlotStatus, OrganizationType, RoleScope
from app.models.user import User
from tests.conftest import make_user_with_role


@pytest.fixture(autouse=True)
def _no_real_email(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("app.modules.booking.service.send_email", lambda **kw: True)


def _make_slot(
    db: Session,
    *,
    starts_at: datetime | None = None,
    status: ConsultingSlotStatus = ConsultingSlotStatus.open,
    booked_by_user_id: int | None = None,
) -> ConsultingSlot:
    slot = ConsultingSlot(
        starts_at=starts_at or (datetime.now(timezone.utc) + timedelta(days=1)),
        duration_minutes=30,
        status=status,
        booked_by_user_id=booked_by_user_id,
        booked_at=datetime.now(timezone.utc) if booked_by_user_id else None,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


# --- admin: manage availability ---------------------------------------------


def test_super_admin_can_batch_create_slots(client: TestClient, super_admin_headers: dict[str, str]):
    starts = [
        (datetime.now(timezone.utc) + timedelta(days=1, hours=h)).isoformat() for h in range(3)
    ]
    res = client.post(
        "/api/v1/admin/booking/slots",
        json={"starts_at_list": starts, "duration_minutes": 45},
        headers=super_admin_headers,
    )
    assert res.status_code == 200, res.text
    items = res.json()["items"]
    assert len(items) == 3
    assert all(item["status"] == "open" for item in items)
    assert all(item["duration_minutes"] == 45 for item in items)


def test_independent_user_cannot_create_slots(client: TestClient, independent_headers: dict[str, str]):
    res = client.post(
        "/api/v1/admin/booking/slots",
        json={"starts_at_list": [(datetime.now(timezone.utc) + timedelta(days=1)).isoformat()]},
        headers=independent_headers,
    )
    assert res.status_code == 403


def test_admin_list_slots_includes_booker_identity(
    db: Session, client: TestClient, independent_user: User, super_admin_headers: dict[str, str],
):
    _make_slot(db, status=ConsultingSlotStatus.booked, booked_by_user_id=independent_user.id)
    res = client.get("/api/v1/admin/booking/slots", headers=super_admin_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["booked_by_email"] == independent_user.email


def test_admin_cannot_delete_a_booked_slot(
    db: Session, client: TestClient, independent_user: User, super_admin_headers: dict[str, str],
):
    slot = _make_slot(db, status=ConsultingSlotStatus.booked, booked_by_user_id=independent_user.id)
    res = client.delete(f"/api/v1/admin/booking/slots/{slot.uuid}", headers=super_admin_headers)
    assert res.status_code == 409


def test_admin_can_delete_an_open_slot(db: Session, client: TestClient, super_admin_headers: dict[str, str]):
    slot = _make_slot(db)
    res = client.delete(f"/api/v1/admin/booking/slots/{slot.uuid}", headers=super_admin_headers)
    assert res.status_code == 200
    assert db.execute(select(ConsultingSlot).where(ConsultingSlot.id == slot.id)).scalar_one_or_none() is None


# --- client: browse + book --------------------------------------------------


def test_list_available_slots_excludes_booked_and_past_slots(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
):
    open_slot = _make_slot(db)
    _make_slot(db, status=ConsultingSlotStatus.booked, booked_by_user_id=independent_user.id)
    _make_slot(db, starts_at=datetime.now(timezone.utc) - timedelta(days=1))

    res = client.get("/api/v1/booking/slots", headers=independent_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["uuid"] == str(open_slot.uuid)


def test_book_slot_succeeds_and_marks_it_booked(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
):
    slot = _make_slot(db)
    res = client.post(
        f"/api/v1/booking/slots/{slot.uuid}/book",
        json={"notes": "Nos gustaría revisar nuestra estrategia de CI"},
        headers=independent_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "booked"

    db.refresh(slot)
    assert slot.status == ConsultingSlotStatus.booked
    assert slot.booked_by_user_id == independent_user.id


def test_book_slot_fails_when_already_booked(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
):
    other_user = make_user_with_role(
        db, email="other-booker@example.com", role_code="independent_user",
        org_type=OrganizationType.individual, role_scope=RoleScope.personal_workspace,
    )
    slot = _make_slot(db, status=ConsultingSlotStatus.booked, booked_by_user_id=other_user.id)
    res = client.post(
        f"/api/v1/booking/slots/{slot.uuid}/book", json={}, headers=independent_headers,
    )
    assert res.status_code == 409


def test_book_slot_fails_when_slot_is_in_the_past(
    client: TestClient, db: Session, independent_headers: dict[str, str],
):
    slot = _make_slot(db, starts_at=datetime.now(timezone.utc) - timedelta(hours=1))
    res = client.post(f"/api/v1/booking/slots/{slot.uuid}/book", json={}, headers=independent_headers)
    assert res.status_code == 409


def test_list_my_bookings_only_returns_own_bookings(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
):
    other_user = make_user_with_role(
        db, email="other-booker2@example.com", role_code="independent_user",
        org_type=OrganizationType.individual, role_scope=RoleScope.personal_workspace,
    )
    mine = _make_slot(db, status=ConsultingSlotStatus.booked, booked_by_user_id=independent_user.id)
    _make_slot(db, status=ConsultingSlotStatus.booked, booked_by_user_id=other_user.id)

    res = client.get("/api/v1/booking/my-bookings", headers=independent_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) == 1
    assert items[0]["uuid"] == str(mine.uuid)


def test_cancel_my_booking_frees_the_slot(
    db: Session, client: TestClient, independent_user: User, independent_headers: dict[str, str],
):
    slot = _make_slot(db, status=ConsultingSlotStatus.booked, booked_by_user_id=independent_user.id)
    res = client.post(f"/api/v1/booking/my-bookings/{slot.uuid}/cancel", headers=independent_headers)
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "open"

    db.refresh(slot)
    assert slot.status == ConsultingSlotStatus.open
    assert slot.booked_by_user_id is None


def test_cancel_my_booking_rejects_someone_elses_booking(
    db: Session, client: TestClient, independent_headers: dict[str, str],
):
    other_user = make_user_with_role(
        db, email="other-booker3@example.com", role_code="independent_user",
        org_type=OrganizationType.individual, role_scope=RoleScope.personal_workspace,
    )
    slot = _make_slot(db, status=ConsultingSlotStatus.booked, booked_by_user_id=other_user.id)
    res = client.post(f"/api/v1/booking/my-bookings/{slot.uuid}/cancel", headers=independent_headers)
    assert res.status_code == 404
