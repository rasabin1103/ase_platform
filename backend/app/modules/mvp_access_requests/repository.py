from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.access_request import AccessRequest
from app.models.enums import AccessRequestStatus


class MvpAccessRequestsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, request_id: int) -> AccessRequest | None:
        stmt = (
            select(AccessRequest)
            .options(selectinload(AccessRequest.requested_by_user))
            .where(AccessRequest.id == request_id)
        )
        return self.db.execute(stmt).scalar_one_or_none()

    def list_for_user(
        self,
        *,
        user_id: int,
        limit: int,
        offset: int,
        status: AccessRequestStatus | None = None,
    ) -> tuple[list[AccessRequest], int]:
        base = select(AccessRequest).where(AccessRequest.requested_by_user_id == user_id)
        if status is not None:
            base = base.where(AccessRequest.status == status)
        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = (
            base.order_by(AccessRequest.created_at.desc(), AccessRequest.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.execute(stmt).scalars().all()), total

    def list_all(
        self,
        *,
        limit: int,
        offset: int,
        status: AccessRequestStatus | None = None,
    ) -> tuple[list[AccessRequest], int]:
        base = select(AccessRequest)
        if status is not None:
            base = base.where(AccessRequest.status == status)
        total = int(self.db.execute(select(func.count()).select_from(base.subquery())).scalar_one())
        stmt = (
            base.options(selectinload(AccessRequest.requested_by_user))
            .order_by(AccessRequest.created_at.desc(), AccessRequest.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self.db.execute(stmt).scalars().all()), total

    def add(self, item: AccessRequest) -> AccessRequest:
        self.db.add(item)
        self.db.flush()
        return item
