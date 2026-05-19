from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.access_request import AccessRequest
from app.models.enums import AccessRequestStatus, AccessRequestType
from app.models.organization import Organization
from app.models.user import User


class AccessRequestsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, request_id: int) -> AccessRequest | None:
        stmt = (
            select(AccessRequest)
            .options(
                selectinload(AccessRequest.organization),
                selectinload(AccessRequest.requested_by_user),
                selectinload(AccessRequest.reviewed_by_user),
            )
            .where(AccessRequest.id == request_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_uuid(self, request_uuid: UUID) -> AccessRequest | None:
        stmt = (
            select(AccessRequest)
            .options(
                selectinload(AccessRequest.organization),
                selectinload(AccessRequest.requested_by_user),
                selectinload(AccessRequest.reviewed_by_user),
            )
            .where(AccessRequest.uuid == request_uuid)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None = None,
        requested_by_user_id: int | None = None,
        status: AccessRequestStatus | None = None,
        creator_only: bool = False,
    ) -> tuple[list[AccessRequest], int]:
        base = select(AccessRequest)
        if organization_id is not None:
            base = base.where(AccessRequest.organization_id == organization_id)
        if requested_by_user_id is not None:
            base = base.where(AccessRequest.requested_by_user_id == requested_by_user_id)
        if status is not None:
            base = base.where(AccessRequest.status == status)
        if creator_only:
            base = base.where(
                AccessRequest.request_type.in_(
                    [
                        AccessRequestType.creator_application,
                        AccessRequestType.product_creator_application,
                        AccessRequestType.course_creator_application,
                    ]
                )
            )

        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = (
            base.options(
                selectinload(AccessRequest.organization),
                selectinload(AccessRequest.requested_by_user),
                selectinload(AccessRequest.reviewed_by_user),
            )
            .order_by(AccessRequest.created_at.desc(), AccessRequest.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.execute(stmt).scalars().all()), total

    def add(self, item: AccessRequest) -> AccessRequest:
        self.db.add(item)
        self.db.flush()
        return item

    def approve(self, item: AccessRequest, *, reviewer_id: int) -> AccessRequest:
        item.status = AccessRequestStatus.approved
        item.reviewed_by_user_id = reviewer_id
        item.reviewed_at = datetime.now(timezone.utc)
        self.db.flush()
        return item

    def reject(self, item: AccessRequest, *, reviewer_id: int) -> AccessRequest:
        item.status = AccessRequestStatus.rejected
        item.reviewed_by_user_id = reviewer_id
        item.reviewed_at = datetime.now(timezone.utc)
        self.db.flush()
        return item

    def get_organization_id(self, *, organization_uuid: UUID | None) -> int | None:
        if organization_uuid is None:
            return None
        return self.db.execute(
            select(Organization.id).where(Organization.uuid == organization_uuid)
        ).scalar_one_or_none()

    def get_user_id(self, *, user_uuid: UUID | None) -> int | None:
        if user_uuid is None:
            return None
        return self.db.execute(select(User.id).where(User.uuid == user_uuid)).scalar_one_or_none()
