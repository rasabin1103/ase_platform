from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import ServiceCategory, ServiceKind
from app.models.service import Service


class ServicesRepository:
    def __init__(self, db: Session):
        self.db = db

    def _options(self):
        return (selectinload(Service.features), selectinload(Service.highlights))

    def get(self, service_id: int) -> Service | None:
        stmt = select(Service).options(*self._options()).where(Service.id == service_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_uuid(self, service_uuid: UUID) -> Service | None:
        stmt = select(Service).options(*self._options()).where(Service.uuid == service_uuid)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_code(self, code: str) -> Service | None:
        stmt = select(Service).options(*self._options()).where(Service.code == code)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_slug(self, slug: str) -> Service | None:
        stmt = select(Service).options(*self._options()).where(Service.slug == slug)
        return self.db.execute(stmt).scalar_one_or_none()

    def list_public(
        self,
        *,
        limit: int,
        offset: int,
        category: ServiceCategory | None = None,
        service_type: ServiceKind | None = None,
    ) -> tuple[list[Service], int]:
        base = select(Service).where(Service.is_active.is_(True))
        if category is not None:
            base = base.where(Service.category == category)
        if service_type is not None:
            base = base.where(Service.service_type == service_type)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = (
            base.options(*self._options())
            .order_by(Service.display_order.asc(), Service.id.asc())
            .limit(limit)
            .offset(offset)
        )
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def list_manage(
        self,
        *,
        limit: int,
        offset: int,
        is_active: bool | None = None,
        category: ServiceCategory | None = None,
    ) -> tuple[list[Service], int]:
        base = select(Service)
        if is_active is not None:
            base = base.where(Service.is_active == is_active)
        if category is not None:
            base = base.where(Service.category == category)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = (
            base.options(*self._options())
            .order_by(Service.display_order.asc(), Service.id.asc())
            .limit(limit)
            .offset(offset)
        )
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, service: Service) -> Service:
        self.db.add(service)
        self.db.flush()
        return service
