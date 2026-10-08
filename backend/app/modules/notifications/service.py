from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.notification_categories import CATEGORIES, CATEGORY_KEYS, MANDATORY_KEYS, category_for_type
from app.modules.notifications.repository import NotificationsRepository
from app.modules.notifications.schemas import (
    CategoryPreferenceRead,
    NotificationListResponse,
    NotificationPreferencesRead,
    NotificationPreferencesUpdate,
    NotificationRead,
)

_MUTE_DELTAS = {
    "1h": timedelta(hours=1),
    "8h": timedelta(hours=8),
    "1d": timedelta(days=1),
    "7d": timedelta(days=7),
    "forever": timedelta(days=365 * 100),
}


def to_read(item) -> NotificationRead:
    read = NotificationRead.model_validate(item)
    read.category = category_for_type(item.type)
    return read


class NotificationsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationsRepository(db)

    def list_for_user(
        self,
        *,
        user_id: int,
        limit: int,
        offset: int,
        category: str | None = None,
        unread_only: bool = False,
    ) -> NotificationListResponse:
        if category is not None and category not in CATEGORY_KEYS:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unknown category")
        items, total = self.repo.list_for_user(
            user_id=user_id, limit=limit, offset=offset, category=category, unread_only=unread_only,
        )
        unread = self.repo.unread_count(user_id=user_id)
        return NotificationListResponse(
            items=[to_read(i) for i in items],
            limit=limit,
            offset=offset,
            total=total,
            unread_count=unread,
        )

    def unread_count(self, *, user_id: int) -> int:
        return self.repo.unread_count(user_id=user_id)

    def mark_read(self, notification_id: int, *, user_id: int) -> NotificationRead:
        item = self.repo.get(notification_id)
        if item is None or item.user_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        item.is_read = True
        self.db.commit()
        self.db.refresh(item)
        return to_read(item)

    def mark_all_read(self, *, user_id: int) -> None:
        self.repo.mark_all_read(user_id=user_id)
        self.db.commit()

    def notify_user(
        self, *, user_id: int, type: str, title: str, body: str | None = None, link: str | None = None,
    ) -> None:
        """Send a single in-app notification to one specific user — used for
        1:1 events like a join-request decision or a member invite."""
        self.repo.create_for_user(user_id=user_id, type=type, title=title, body=body, link=link)
        self.db.commit()

    def notify_all_non_superadmin(self, *, type: str, title: str, body: str | None = None, link: str | None = None) -> int:
        count = self.repo.bulk_create_for_all_non_superadmin(type=type, title=title, body=body, link=link)
        self.db.commit()
        return count

    def notify_superadmins(self, *, type: str, title: str, body: str | None = None, link: str | None = None) -> None:
        self.repo.bulk_create_for_superadmins(type=type, title=title, body=body, link=link)
        self.db.commit()

    def notify_org_admins(
        self, *, organization_id: int, type: str, title: str, body: str | None = None, link: str | None = None,
    ) -> bool:
        """Notify the org_owner/org_admin members of an organization. Returns
        True if at least one admin was notified; if False, no rows were
        inserted (org has no owner/admin) and the caller should fall back."""
        notified = self.repo.bulk_create_for_org_admins(
            organization_id=organization_id, type=type, title=title, body=body, link=link,
        )
        self.db.commit()
        return notified

    def delete(self, notification_id: int, *, user_id: int) -> None:
        if not self.repo.delete_for_user(notification_id, user_id=user_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
        self.db.commit()

    def delete_read(self, *, user_id: int) -> int:
        n = self.repo.delete_read_for_user(user_id=user_id)
        self.db.commit()
        return n

    # --- preferences -------------------------------------------------------

    def get_preferences(self, *, user_id: int) -> NotificationPreferencesRead:
        return self._preferences_read(self.repo.get_preference(user_id))

    def update_preferences(
        self, *, user_id: int, payload: NotificationPreferencesUpdate,
    ) -> NotificationPreferencesRead:
        unknown = set(payload.categories) - CATEGORY_KEYS
        if unknown:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Unknown category: {sorted(unknown)[0]}")
        pref = self.repo.get_or_create_preference(user_id)

        if payload.digest_frequency is not None:
            pref.digest_frequency = payload.digest_frequency
        if payload.mute is not None:
            pref.muted_until = (
                None if payload.mute == "off" else datetime.now(timezone.utc) + _MUTE_DELTAS[payload.mute]
            )
        if payload.categories:
            merged = dict(pref.categories or {})
            for key, change in payload.categories.items():
                if key in MANDATORY_KEYS:
                    continue  # account/security notices can't be turned off
                current = dict(merged.get(key, {}))
                if change.in_app is not None:
                    current["in_app"] = change.in_app
                if change.email is not None:
                    current["email"] = change.email
                merged[key] = current
            pref.categories = merged  # reassign so the JSONB change is detected
        self.db.commit()
        self.db.refresh(pref)
        return self._preferences_read(pref)

    @staticmethod
    def _preferences_read(pref) -> NotificationPreferencesRead:
        stored = (pref.categories if pref is not None else None) or {}
        now = datetime.now(timezone.utc)
        muted_until = pref.muted_until if pref is not None else None
        return NotificationPreferencesRead(
            muted_until=muted_until,
            is_muted=bool(muted_until and muted_until > now),
            digest_frequency=(pref.digest_frequency if pref is not None else "off"),
            categories=[
                CategoryPreferenceRead(
                    key=c.key,
                    mandatory=c.mandatory,
                    in_app=True if c.mandatory else stored.get(c.key, {}).get("in_app", True),
                    email=stored.get(c.key, {}).get("email", False),
                )
                for c in CATEGORIES
            ],
        )
