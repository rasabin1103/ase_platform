"""Notification preferences: per-category on/off, global mute, mandatory
account notices, filtered list/delete endpoints, and the email/digest sweep."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core import notification_email
from app.core.notification_categories import category_for_type
from app.models.notification import Notification
from app.models.user import User
from app.modules.notifications.schemas import CategoryPreferenceUpdate, NotificationPreferencesUpdate
from app.modules.notifications.service import NotificationsService

from .conftest import auth_headers

API = "/api/v1/notifications"


def _count(db: Session, user: User, type_: str | None = None) -> int:
    stmt = select(Notification).where(Notification.user_id == user.id)
    if type_:
        stmt = stmt.where(Notification.type == type_)
    return len(db.scalars(stmt).all())


def test_type_to_category_mapping():
    assert category_for_type("catalog_item_added") == "catalog"
    assert category_for_type("job_posting") == "jobs"
    assert category_for_type("org_join_request_created") == "organization"
    assert category_for_type("loyalty_tier_up") == "rewards"
    assert category_for_type("access_request_created") == "account"
    assert category_for_type("some_future_type") == "announcements"  # unknown never becomes un-mutable


def test_defaults_are_everything_on_in_app_email_off(client, db: Session, independent_user: User):
    body = client.get(f"{API}/preferences", headers=auth_headers(independent_user)).json()
    assert body["is_muted"] is False and body["digest_frequency"] == "off"
    cats = {c["key"]: c for c in body["categories"]}
    assert all(c["in_app"] for c in cats.values()) and not any(c["email"] for c in cats.values())
    assert cats["account"]["mandatory"] is True


def test_disabled_category_is_not_created_but_others_are(db: Session, independent_user: User):
    svc = NotificationsService(db)
    svc.update_preferences(
        user_id=independent_user.id,
        payload=NotificationPreferencesUpdate(categories={"jobs": CategoryPreferenceUpdate(in_app=False)}),
    )
    svc.notify_user(user_id=independent_user.id, type="job_posting", title="New job")
    svc.notify_user(user_id=independent_user.id, type="catalog_item_added", title="New item")
    assert _count(db, independent_user, "job_posting") == 0
    assert _count(db, independent_user, "catalog_item_added") == 1


def test_global_mute_blocks_optional_but_not_account_notices(db: Session, independent_user: User):
    svc = NotificationsService(db)
    prefs = svc.update_preferences(user_id=independent_user.id, payload=NotificationPreferencesUpdate(mute="1d"))
    assert prefs.is_muted is True and prefs.muted_until is not None

    svc.notify_user(user_id=independent_user.id, type="catalog_item_added", title="muted")
    svc.notify_user(user_id=independent_user.id, type="plan", title="Payment failed")  # mandatory
    assert _count(db, independent_user, "catalog_item_added") == 0
    assert _count(db, independent_user, "plan") == 1

    svc.update_preferences(user_id=independent_user.id, payload=NotificationPreferencesUpdate(mute="off"))
    svc.notify_user(user_id=independent_user.id, type="catalog_item_added", title="back")
    assert _count(db, independent_user, "catalog_item_added") == 1


def test_mandatory_category_cannot_be_switched_off(db: Session, independent_user: User):
    prefs = NotificationsService(db).update_preferences(
        user_id=independent_user.id,
        payload=NotificationPreferencesUpdate(categories={"account": CategoryPreferenceUpdate(in_app=False)}),
    )
    assert next(c for c in prefs.categories if c.key == "account").in_app is True


def test_broadcast_skips_only_the_users_who_opted_out(db: Session, independent_user: User):
    other = User(email="other@example.com", password_hash="x", first_name="O", last_name="O", display_name="O")
    db.add(other)
    db.commit()
    svc = NotificationsService(db)
    svc.update_preferences(
        user_id=independent_user.id,
        payload=NotificationPreferencesUpdate(categories={"catalog": CategoryPreferenceUpdate(in_app=False)}),
    )
    svc.notify_all_non_superadmin(type="catalog_item_added", title="New")
    assert _count(db, independent_user) == 0
    assert _count(db, other) == 1


def test_endpoints_update_filter_and_delete(client, db: Session, independent_user: User):
    h = auth_headers(independent_user)
    r = client.put(
        f"{API}/preferences",
        headers=h,
        json={"digest_frequency": "weekly", "categories": {"blog": {"in_app": False, "email": True}}},
    )
    assert r.status_code == 200
    blog = next(c for c in r.json()["categories"] if c["key"] == "blog")
    assert (blog["in_app"], blog["email"], r.json()["digest_frequency"]) == (False, True, "weekly")
    assert client.put(f"{API}/preferences", headers=h, json={"categories": {"nope": {"in_app": False}}}).status_code == 422

    svc = NotificationsService(db)
    svc.notify_user(user_id=independent_user.id, type="catalog_item_added", title="c1")
    svc.notify_user(user_id=independent_user.id, type="job_posting", title="j1")
    listed = client.get(API, headers=h, params={"category": "jobs"}).json()
    assert [n["title"] for n in listed["items"]] == ["j1"] and listed["items"][0]["category"] == "jobs"

    first = client.get(API, headers=h).json()["items"][0]
    client.patch(f"{API}/{first['id']}/read", headers=h)
    assert len(client.get(API, headers=h, params={"unread_only": True}).json()["items"]) == 1
    assert client.delete(f"{API}/read", headers=h).json() == {"deleted": 1}
    last = client.get(API, headers=h).json()["items"][0]
    assert client.delete(f"{API}/{last['id']}", headers=h).status_code == 204
    assert client.delete(f"{API}/{last['id']}", headers=h).status_code == 404


@pytest.fixture()
def sent_emails(monkeypatch):
    sent: list[dict] = []

    def fake(*, to_email, subject, html_body, text_body=None, reply_to=None):
        sent.append({"to": to_email, "subject": subject, "text": text_body})
        return True

    monkeypatch.setattr(notification_email, "send_email", fake)
    return sent


def _enable_email(db: Session, user: User, category: str, digest: str = "off"):
    NotificationsService(db).update_preferences(
        user_id=user.id,
        payload=NotificationPreferencesUpdate(
            digest_frequency=digest, categories={category: CategoryPreferenceUpdate(email=True)}
        ),
    )


def test_email_sweep_sends_only_enabled_categories_once(db: Session, independent_user: User, sent_emails):
    _enable_email(db, independent_user, "catalog")
    svc = NotificationsService(db)
    svc.notify_user(user_id=independent_user.id, type="catalog_item_added", title="Catalog news")
    svc.notify_user(user_id=independent_user.id, type="job_posting", title="Job news")

    assert notification_email.run_notification_email_sweep(db) == 1
    assert len(sent_emails) == 1 and "Catalog news" in sent_emails[0]["text"] and "Job news" not in sent_emails[0]["text"]
    assert notification_email.run_notification_email_sweep(db) == 0  # already emailed
    assert len(sent_emails) == 1


def test_email_sweep_does_nothing_without_opt_in(db: Session, independent_user: User, sent_emails):
    NotificationsService(db).notify_user(user_id=independent_user.id, type="catalog_item_added", title="x")
    assert notification_email.run_notification_email_sweep(db) == 0 and sent_emails == []


def test_digest_waits_for_its_period(db: Session, independent_user: User, sent_emails):
    _enable_email(db, independent_user, "catalog", digest="daily")
    svc = NotificationsService(db)
    svc.notify_user(user_id=independent_user.id, type="catalog_item_added", title="first")
    now = datetime.now(timezone.utc)
    assert notification_email.run_notification_email_sweep(db, now=now) == 1

    svc.notify_user(user_id=independent_user.id, type="catalog_item_added", title="second")
    assert notification_email.run_notification_email_sweep(db, now=now + timedelta(hours=2)) == 0
    assert notification_email.run_notification_email_sweep(db, now=now + timedelta(hours=25)) == 1
    assert "second" in sent_emails[1]["text"] and "first" not in sent_emails[1]["text"]


def test_failed_send_is_retried_next_sweep(db: Session, independent_user: User, monkeypatch):
    _enable_email(db, independent_user, "catalog")
    NotificationsService(db).notify_user(user_id=independent_user.id, type="catalog_item_added", title="retry me")
    monkeypatch.setattr(notification_email, "send_email", lambda **kw: False)
    assert notification_email.run_notification_email_sweep(db) == 0
    calls = []
    monkeypatch.setattr(notification_email, "send_email", lambda **kw: calls.append(kw) or True)
    assert notification_email.run_notification_email_sweep(db) == 1 and len(calls) == 1
