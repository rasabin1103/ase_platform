from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.notifications.repository import NotificationsRepository
from app.modules.notifications.schemas import NotificationListResponse, NotificationRead


class NotificationsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationsRepository(db)

    def list_for_user(self, *, user_id: int, limit: int, offset: int) -> NotificationListResponse:
        items, total = self.repo.list_for_user(user_id=user_id, limit=limit, offset=offset)
        unread = self.repo.unread_count(user_id=user_id)
        return NotificationListResponse(
            items=[NotificationRead.model_validate(i) for i in items],
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
        return NotificationRead.model_validate(item)

    def mark_all_read(self, *, user_id: int) -> None:
        self.repo.mark_all_read(user_id=user_id)
        self.db.commit()

    def notify_all_non_superadmin(self, *, type: str, title: str, body: str | None = None, link: str | None = None) -> None:
        self.repo.bulk_create_for_all_non_superadmin(type=type, title=title, body=body, link=link)
        self.db.commit()

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
