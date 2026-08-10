from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.suggestion import SUGGESTION_STATUSES, SUGGESTION_TARGETS, Suggestion
from app.modules.notifications.service import NotificationsService
from app.modules.suggestions.repository import SuggestionsRepository
from app.modules.suggestions.schemas import (
    SuggestionCreate,
    SuggestionListResponse,
    SuggestionRead,
    SuggestionUpdate,
)

logger = logging.getLogger(__name__)


class SuggestionsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = SuggestionsRepository(db)

    def _to_read(self, item: Suggestion, *, user_email: str | None, organization_name: str | None) -> SuggestionRead:
        return SuggestionRead(
            id=item.id,
            user_id=item.user_id,
            user_email=user_email,
            organization_id=item.organization_id,
            organization_name=organization_name,
            message=item.message,
            target=item.target,
            status=item.status,
            admin_note=item.admin_note,
            reviewed_by_user_id=item.reviewed_by_user_id,
            reviewed_at=item.reviewed_at,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )

    def create(self, payload: SuggestionCreate, *, user_id: int, organization_id: int | None) -> SuggestionRead:
        target = payload.target if payload.target in SUGGESTION_TARGETS else "platform"
        # Can only target an organization if the sender actually has one.
        if target == "organization" and organization_id is None:
            target = "platform"

        item = Suggestion(
            user_id=user_id,
            organization_id=organization_id,
            message=payload.message,
            target=target,
            status="pending",
        )
        self.repo.add(item)
        self.db.commit()
        self.db.refresh(item)
        try:
            preview = item.message if len(item.message) <= 140 else f"{item.message[:140]}…"
            notifications = NotificationsService(self.db)
            notified = False
            if target == "organization" and organization_id is not None:
                notified = notifications.notify_org_admins(
                    organization_id=organization_id,
                    type="suggestion_created",
                    title="Nueva sugerencia para tu organización",
                    body=preview,
                    link=None,
                )
            if not notified:
                notifications.notify_superadmins(
                    type="suggestion_created",
                    title="Nueva sugerencia recibida",
                    body=preview,
                    link="/admin/suggestions",
                )
        except Exception:
            self.db.rollback()
            logger.exception("Failed to notify recipients about new suggestion %s", item.id)
        return self._to_read(item, user_email=None, organization_name=None)

    def list_for_user(self, *, user_id: int, limit: int, offset: int) -> SuggestionListResponse:
        rows, total = self.repo.list_for_user(user_id=user_id, limit=limit, offset=offset)
        return SuggestionListResponse(
            items=[self._to_read(item, user_email=email, organization_name=org_name) for item, email, org_name in rows],
            limit=limit,
            offset=offset,
            total=total,
        )

    def list_all(self, *, limit: int, offset: int, status_filter: str | None) -> SuggestionListResponse:
        rows, total = self.repo.list_all(limit=limit, offset=offset, status=status_filter)
        return SuggestionListResponse(
            items=[self._to_read(item, user_email=email, organization_name=org_name) for item, email, org_name in rows],
            limit=limit,
            offset=offset,
            total=total,
        )

    def update(self, suggestion_id: int, payload: SuggestionUpdate, *, reviewer_id: int) -> SuggestionRead:
        item = self.repo.get(suggestion_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Suggestion not found")
        if payload.status is not None:
            if payload.status not in SUGGESTION_STATUSES:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")
            item.status = payload.status
            item.reviewed_by_user_id = reviewer_id
            item.reviewed_at = datetime.now(timezone.utc)
        if payload.admin_note is not None:
            item.admin_note = payload.admin_note
        self.db.commit()
        self.db.refresh(item)
        return self._to_read(
            item,
            user_email=item.user.email if item.user else None,
            organization_name=item.organization.name if item.organization else None,
        )
