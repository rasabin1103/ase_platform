from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.creator import assign_content_creator_role, is_creator_request_type
from app.models.access_request import AccessRequest
from app.models.enums import AccessRequestStatus, AccessRequestType
from app.modules.access_requests.repository import AccessRequestsRepository
from app.modules.access_requests.schemas import (
    AccessRequestCreate,
    AccessRequestRead,
    AccessRequestUpdate,
    CreatorApplicationCreate,
)


class AccessRequestsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AccessRequestsRepository(db)

    def _to_read(self, item: AccessRequest) -> AccessRequestRead:
        return AccessRequestRead(
            id=item.id,
            uuid=item.uuid,
            organization_id=item.organization_id,
            organization_uuid=item.organization.uuid if item.organization else None,
            requested_by_user_id=item.requested_by_user_id,
            requested_by_user_uuid=item.requested_by_user.uuid if item.requested_by_user else None,
            reviewed_by_user_id=item.reviewed_by_user_id,
            reviewed_by_user_uuid=item.reviewed_by_user.uuid if item.reviewed_by_user else None,
            request_type=item.request_type,
            target_entity_type=item.target_entity_type,
            target_entity_id=item.target_entity_id,
            title=item.title,
            description=item.description,
            status=item.status,
            priority=item.priority,
            metadata_json=item.metadata_json,
            created_at=item.created_at,
            updated_at=item.updated_at,
            reviewed_at=item.reviewed_at,
        )

    def _scope_to_request_type(self, scope: str) -> AccessRequestType:
        if scope == "courses":
            return AccessRequestType.course_creator_application
        if scope == "products":
            return AccessRequestType.product_creator_application
        return AccessRequestType.creator_application

    def create(self, payload: AccessRequestCreate, *, requested_by_user_id: int) -> AccessRequestRead:
        item = AccessRequest(
            organization_id=payload.organization_id,
            requested_by_user_id=requested_by_user_id,
            request_type=payload.request_type,
            target_entity_type=payload.target_entity_type,
            target_entity_id=payload.target_entity_id,
            title=payload.title,
            description=payload.description,
            priority=payload.priority,
            metadata_json=payload.metadata_json,
            status=AccessRequestStatus.pending,
        )
        self.repo.add(item)
        self.db.commit()
        self.db.refresh(item)
        return self._to_read(item)

    def create_creator_application(
        self,
        payload: CreatorApplicationCreate,
        *,
        requested_by_user_id: int,
        organization_id: int | None,
    ) -> AccessRequestRead:
        request_type = self._scope_to_request_type(payload.creator_scope)
        metadata = {
            "creator_scope": payload.creator_scope,
            "experience": payload.experience,
            "knowledge_areas": payload.knowledge_areas,
            "portfolio_url": payload.portfolio_url,
            "motivation": payload.motivation,
            "initial_proposal": payload.initial_proposal,
            "quality_agreement": payload.quality_agreement,
        }
        title_map = {
            "courses": "Creator application — courses",
            "products": "Creator application — products",
            "both": "Creator application — courses and products",
        }
        return self.create(
            AccessRequestCreate(
                organization_id=organization_id,
                request_type=request_type,
                target_entity_type="creator_program",
                target_entity_id=payload.creator_scope,
                title=title_map[payload.creator_scope],
                description=payload.motivation,
                metadata_json=metadata,
            ),
            requested_by_user_id=requested_by_user_id,
        )

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None = None,
        requested_by_user_id: int | None = None,
        status: AccessRequestStatus | None = None,
        creator_only: bool = False,
    ) -> tuple[list[AccessRequestRead], int]:
        items, total = self.repo.list(
            limit=limit,
            offset=offset,
            organization_id=organization_id,
            requested_by_user_id=requested_by_user_id,
            status=status,
            creator_only=creator_only,
        )
        return [self._to_read(i) for i in items], total

    def get(self, request_id: int) -> AccessRequestRead:
        item = self.repo.get(request_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
        return self._to_read(item)

    def update(self, request_id: int, payload: AccessRequestUpdate) -> AccessRequestRead:
        item = self.repo.get(request_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        self.db.commit()
        self.db.refresh(item)
        return self._to_read(item)

    def approve(self, request_id: int, *, reviewer_id: int) -> AccessRequestRead:
        item = self.repo.get(request_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
        if item.status != AccessRequestStatus.pending:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request is not pending")

        if is_creator_request_type(item.request_type):
            try:
                assign_content_creator_role(
                    self.db,
                    user_id=item.requested_by_user_id,
                    assigned_by_user_id=reviewer_id,
                )
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        self.repo.approve(item, reviewer_id=reviewer_id)
        self.db.commit()
        self.db.refresh(item)
        return self._to_read(item)

    def reject(self, request_id: int, *, reviewer_id: int) -> AccessRequestRead:
        item = self.repo.get(request_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
        self.repo.reject(item, reviewer_id=reviewer_id)
        self.db.commit()
        self.db.refresh(item)
        return self._to_read(item)
