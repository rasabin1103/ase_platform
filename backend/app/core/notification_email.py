"""Email delivery for in-app notifications, driven by a scheduled sweep
(never from the request that creates the notification, so a slow SMTP server
can't slow an API call down or fail it).

Per user (only those who switched a category's email on):
- digest "off":    one email per sweep with whatever is new.
- digest "daily":  one summary at most every ~24h.
- digest "weekly": one summary at most every ~7 days.
A notification is emailed once (Notification.emailed_at); only categories the
user enabled for email are ever included.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.email import send_email
from app.core.email_templates import notifications_email
from app.core.notification_categories import category_for_type
from app.models.enums import UserStatus
from app.models.notification import Notification
from app.models.notification_preference import NotificationPreference
from app.models.user import User

logger = logging.getLogger(__name__)

_MAX_ITEMS_PER_EMAIL = 15
_LOOKBACK = timedelta(days=30)
_DIGEST_MIN_GAP = {"daily": timedelta(hours=23), "weekly": timedelta(days=6, hours=12)}


def _email_categories(pref: NotificationPreference) -> set[str]:
    return {key for key, cfg in (pref.categories or {}).items() if cfg.get("email") is True}


def run_notification_email_sweep(db: Session, *, now: datetime | None = None) -> int:
    """Returns the number of emails sent."""
    now = now or datetime.now(timezone.utc)
    sent = 0
    prefs = db.execute(select(NotificationPreference)).scalars().all()
    for pref in prefs:
        enabled = _email_categories(pref)
        if not enabled:
            continue
        gap = _DIGEST_MIN_GAP.get(pref.digest_frequency)
        if gap and pref.last_digest_sent_at and now - pref.last_digest_sent_at < gap:
            continue
        user = db.get(User, pref.user_id)
        if user is None or user.status != UserStatus.active or not user.email:
            continue

        pending = [
            n
            for n in db.execute(
                select(Notification)
                .where(
                    Notification.user_id == pref.user_id,
                    Notification.emailed_at.is_(None),
                    Notification.created_at >= now - _LOOKBACK,
                )
                .order_by(Notification.created_at.desc())
            ).scalars()
            if category_for_type(n.type) in enabled
        ]
        if not pending:
            continue

        shown = pending[:_MAX_ITEMS_PER_EMAIL]
        subject, html, text = notifications_email(
            [(n.title, n.body) for n in shown],
            extra_count=len(pending) - len(shown),
            notifications_url=f"{settings.FRONTEND_URL}/notifications",
            is_digest=pref.digest_frequency != "off",
            language=user.preferred_language,
        )
        try:
            ok = send_email(to_email=user.email, subject=subject, html_body=html, text_body=text)
        except Exception:
            logger.exception("Notification email failed for user %s", user.id)
            continue
        if not ok:
            continue  # SMTP not configured / failed: leave unmarked, retry next sweep
        for n in pending:
            n.emailed_at = now
        if gap:
            pref.last_digest_sent_at = now
        db.commit()
        sent += 1
    return sent
