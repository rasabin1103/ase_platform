from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import UserStatus
from app.models.user import User
from app.modules.notifications.service import NotificationsService

logger = logging.getLogger(__name__)

_MILESTONE_STEP_MONTHS = 6


def _months_since(created_at: datetime, *, now: datetime) -> int:
    months = (now.year - created_at.year) * 12 + (now.month - created_at.month)
    if now.day < created_at.day:
        months -= 1
    return max(months, 0)


def _tenure_label(months: int) -> str:
    years, remainder = divmod(months, 12)
    if years and remainder:
        return f"{years} año{'s' if years != 1 else ''} y {remainder} mes{'es' if remainder != 1 else ''}"
    if years:
        return f"{years} año{'s' if years != 1 else ''}"
    return f"{months} meses"


def run_anniversary_sweep(db: Session) -> int:
    """Sends a one-time thank-you notification to every active user who has
    just crossed a 6-month multiple of their signup date (6, 12, 18, ...
    months since `created_at`). Idempotent per milestone via
    `User.last_anniversary_months_notified` — a user is never thanked twice
    for the same milestone even if the sweep runs more than once, and a
    milestone that was somehow skipped (server downtime, etc.) still gets
    sent on the next run since it only checks "have we notified for at
    least this many months", not "did we run exactly on day N"."""
    now = datetime.now(timezone.utc)
    stmt = select(User).where(User.status == UserStatus.active)
    users = db.execute(stmt).scalars().all()

    notifications = NotificationsService(db)
    count = 0
    for user in users:
        months = _months_since(user.created_at, now=now)
        if months < _MILESTONE_STEP_MONTHS or months % _MILESTONE_STEP_MONTHS != 0:
            continue
        if (user.last_anniversary_months_notified or 0) >= months:
            continue
        try:
            notifications.notify_user(
                user_id=user.id,
                type="account_anniversary",
                title="¡Gracias por estar con nosotros!",
                body=f"Llevas {_tenure_label(months)} formando parte de la familia ASE. ¡Gracias por tu confianza y por seguir con nosotros!",
            )
            user.last_anniversary_months_notified = months
            db.commit()
            count += 1
        except Exception:
            db.rollback()
            logger.exception("Failed to send anniversary notification to user %s", user.id)
    return count
