from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.media_urls import resolve_user_avatar_url, user_has_stored_avatar
from app.models.access_request import AccessRequest
from app.models.enums import (
    AccessRequestStatus,
    AccessRequestType,
    CreatorStatus,
)
from app.models.user import User
from app.modules.mvp_access_requests.repository import MvpAccessRequestsRepository
from app.modules.mvp_access_requests.schemas import (
    AdminAccessRequestListResponse,
    AdminAccessRequestRead,
    AdminAccessRequestReview,
    MeAccessRequestCreate,
    MeAccessRequestListResponse,
    MeAccessRequestRead,
    RequesterSummary,
)

MVP_REQUEST_TYPES = frozenset(
    {
        AccessRequestType.product_access,
        AccessRequestType.demo_access,
        AccessRequestType.creator_access,
    }
)

MVP_TARGET_TYPES = frozenset(
    {"product", "course", "book", "resource", "platform_creator_permission"}
)

CATALOG_TARGET_TYPES = frozenset({"product", "course", "book", "resource"})


def _to_me_read(item: AccessRequest) -> MeAccessRequestRead:
    return MeAccessRequestRead(
        id=item.id,
        uuid=item.uuid,
        request_type=item.request_type,
        target_type=item.target_entity_type,
        target_id=item.target_entity_id,
        title=item.title,
        message=item.description,
        status=item.status,
        admin_notes=item.admin_notes,
        reviewed_at=item.reviewed_at,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


def _requester_summary(user: User) -> RequesterSummary:
    return RequesterSummary(
        user_id=user.id,
        email=user.email,
        display_name=user.display_name,
        first_name=user.first_name,
        last_name=user.last_name,
        avatar_url=resolve_user_avatar_url(user),
        has_avatar=user_has_stored_avatar(user),
    )


def _to_admin_read(item: AccessRequest) -> AdminAccessRequestRead:
    requester = item.requested_by_user
    return AdminAccessRequestRead(
        id=item.id,
        uuid=item.uuid,
        request_type=item.request_type,
        target_type=item.target_entity_type,
        target_id=item.target_entity_id,
        title=item.title,
        message=item.description,
        status=item.status,
        admin_notes=item.admin_notes,
        reviewed_at=item.reviewed_at,
        created_at=item.created_at,
        updated_at=item.updated_at,
        requester=_requester_summary(requester),
    )


class MvpAccessRequestsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = MvpAccessRequestsRepository(db)

    def create_for_user(self, *, user: User, payload: MeAccessRequestCreate) -> MeAccessRequestRead:
        request_type = AccessRequestType(payload.request_type)
        target_type = payload.target_type.strip().lower()
        if target_type not in MVP_TARGET_TYPES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid target_type")

        target_id = (payload.target_id or "").strip()
        if request_type == AccessRequestType.creator_access:
            if target_type != "platform_creator_permission":
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="creator_access requires target_type platform_creator_permission",
                )
            if not target_id:
                target_id = "platform"
        elif request_type in (AccessRequestType.product_access, AccessRequestType.demo_access):
            if target_type not in CATALOG_TARGET_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Catalog target_type required for this request",
                )
            if not target_id:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="target_id is required",
                )
            if request_type == AccessRequestType.demo_access and target_type not in ("product", "course"):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="demo_access applies to product or course only",
                )
        else:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid request_type")

        item = AccessRequest(
            organization_id=None,
            requested_by_user_id=user.id,
            request_type=request_type,
            target_entity_type=target_type,
            target_entity_id=target_id[:64],
            title=payload.title.strip(),
            description=(payload.message or "").strip() or None,
            status=AccessRequestStatus.pending,
        )
        self.repo.add(item)

        if request_type == AccessRequestType.creator_access and user.creator_status == CreatorStatus.none:
            user.creator_status = CreatorStatus.pending

        self.db.commit()
        self.db.refresh(item)
        return _to_me_read(item)

    def list_for_user(
        self,
        *,
        user_id: int,
        limit: int,
        offset: int,
        status_filter: AccessRequestStatus | None = None,
    ) -> MeAccessRequestListResponse:
        items, total = self.repo.list_for_user(
            user_id=user_id,
            limit=limit,
            offset=offset,
            status=status_filter,
        )
        return MeAccessRequestListResponse(
            items=[_to_me_read(i) for i in items],
            limit=limit,
            offset=offset,
            total=total,
        )

    def list_all_admin(
        self,
        *,
        limit: int,
        offset: int,
        status_filter: AccessRequestStatus | None = None,
    ) -> AdminAccessRequestListResponse:
        items, total = self.repo.list_all(limit=limit, offset=offset, status=status_filter)
        return AdminAccessRequestListResponse(
            items=[_to_admin_read(i) for i in items],
            limit=limit,
            offset=offset,
            total=total,
        )

    def review(
        self,
        *,
        request_id: int,
        reviewer: User,
        payload: AdminAccessRequestReview,
    ) -> AdminAccessRequestRead:
        item = self.repo.get(request_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
        if item.status != AccessRequestStatus.pending:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Request already reviewed")

        new_status = AccessRequestStatus(payload.status)
        item.status = new_status
        item.reviewed_by_user_id = reviewer.id
        item.reviewed_at = datetime.now(timezone.utc)
        if payload.admin_notes is not None:
            item.admin_notes = payload.admin_notes.strip() or None

        requester = self.db.get(User, item.requested_by_user_id)
        if requester is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Requester not found")

        if item.request_type == AccessRequestType.creator_access:
            if new_status == AccessRequestStatus.approved:
                requester.can_create_content = True
                requester.creator_status = CreatorStatus.approved
            elif new_status == AccessRequestStatus.rejected:
                if requester.creator_status == CreatorStatus.pending:
                    requester.creator_status = CreatorStatus.rejected

        self.db.commit()
        self.db.refresh(item)
        refreshed = self.repo.get(request_id)
        assert refreshed is not None
        return _to_admin_read(refreshed)
