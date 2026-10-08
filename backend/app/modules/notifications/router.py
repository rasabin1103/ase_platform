from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.notifications.schemas import (
    NotificationListResponse,
    NotificationPreferencesRead,
    NotificationPreferencesUpdate,
    NotificationRead,
    UnreadCountRead,
)
from app.modules.notifications.service import NotificationsService

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


def get_service(db: Session = Depends(get_db)) -> NotificationsService:
    return NotificationsService(db)


@router.get("", response_model=NotificationListResponse)
def list_my_notifications(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    category: str | None = Query(default=None),
    unread_only: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    svc: NotificationsService = Depends(get_service),
):
    return svc.list_for_user(
        user_id=current_user.id, limit=limit, offset=offset, category=category, unread_only=unread_only,
    )


# Declared before /{notification_id}/... so "preferences" is never parsed as an id.
@router.get("/preferences", response_model=NotificationPreferencesRead)
def get_my_notification_preferences(
    current_user: User = Depends(get_current_user),
    svc: NotificationsService = Depends(get_service),
):
    return svc.get_preferences(user_id=current_user.id)


@router.put("/preferences", response_model=NotificationPreferencesRead)
def update_my_notification_preferences(
    payload: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    svc: NotificationsService = Depends(get_service),
):
    return svc.update_preferences(user_id=current_user.id, payload=payload)


@router.get("/unread-count", response_model=UnreadCountRead)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    svc: NotificationsService = Depends(get_service),
):
    return UnreadCountRead(unread_count=svc.unread_count(user_id=current_user.id))


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    svc: NotificationsService = Depends(get_service),
):
    return svc.mark_read(notification_id, user_id=current_user.id)


@router.post("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    svc: NotificationsService = Depends(get_service),
):
    svc.mark_all_read(user_id=current_user.id)
    return {"ok": True}


@router.delete("/read")
def delete_read_notifications(
    current_user: User = Depends(get_current_user),
    svc: NotificationsService = Depends(get_service),
):
    return {"deleted": svc.delete_read(user_id=current_user.id)}


@router.delete("/{notification_id}", status_code=204)
def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    svc: NotificationsService = Depends(get_service),
):
    svc.delete(notification_id, user_id=current_user.id)
