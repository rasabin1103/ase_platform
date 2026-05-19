from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import ServiceCategory, ServiceKind
from app.models.service import Service
from app.models.service_feature import ServiceFeature
from app.models.service_highlight import ServiceHighlight
from app.modules.services.repository import ServicesRepository
from app.modules.services.schemas import (
    ServiceCreate,
    ServiceFeatureCreate,
    ServiceHighlightCreate,
    ServiceUpdate,
)


class ServicesService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ServicesRepository(db)

    def list_public(
        self,
        *,
        limit: int,
        offset: int,
        category: ServiceCategory | None,
        service_type: ServiceKind | None,
    ) -> tuple[list[Service], int]:
        return self.repo.list_public(
            limit=limit,
            offset=offset,
            category=category,
            service_type=service_type,
        )

    def list_manage(
        self,
        *,
        limit: int,
        offset: int,
        is_active: bool | None,
        category: ServiceCategory | None,
    ) -> tuple[list[Service], int]:
        return self.repo.list_manage(
            limit=limit,
            offset=offset,
            is_active=is_active,
            category=category,
        )

    def get_public(self, service_uuid: UUID) -> Service:
        svc = self.repo.get_by_uuid(service_uuid)
        if svc is None or not svc.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
        return svc

    def get_manage(self, service_uuid: UUID) -> Service:
        svc = self.repo.get_by_uuid(service_uuid)
        if svc is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
        return svc

    def create(self, payload: ServiceCreate) -> Service:
        if self.repo.get_by_code(payload.code) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service code already exists")
        if self.repo.get_by_slug(payload.slug) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service slug already exists")

        service = Service(
            code=payload.code,
            name=payload.name,
            slug=payload.slug,
            short_description=payload.short_description,
            description=payload.description,
            category=payload.category,
            service_type=payload.service_type,
            price_type=payload.price_type,
            is_featured=payload.is_featured,
            is_active=payload.is_active,
            display_order=payload.display_order,
            icon=payload.icon,
            hero_title=payload.hero_title,
            hero_subtitle=payload.hero_subtitle,
        )
        self.repo.add(service)
        self.db.flush()
        self._sync_features(service, payload.features or [])
        self._sync_highlights(service, payload.highlights or [])
        self.db.commit()
        return self.repo.get(service.id)  # type: ignore[arg-type]

    def update(self, service_uuid: UUID, payload: ServiceUpdate) -> Service:
        service = self.get_manage(service_uuid)

        data = payload.model_dump(exclude_unset=True, exclude={"features", "highlights"})
        if "code" in data and data["code"] != service.code:
            if self.repo.get_by_code(data["code"]) is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service code already exists")
        if "slug" in data and data["slug"] != service.slug:
            if self.repo.get_by_slug(data["slug"]) is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service slug already exists")
        for key, value in data.items():
            setattr(service, key, value)

        if "features" in payload.model_fields_set:
            service.features.clear()
            self.db.flush()
            self._sync_features(service, payload.features or [])

        if "highlights" in payload.model_fields_set:
            service.highlights.clear()
            self.db.flush()
            self._sync_highlights(service, payload.highlights or [])

        self.db.commit()
        return self.repo.get(service.id)  # type: ignore[arg-type]

    def deactivate(self, service_uuid: UUID) -> Service:
        service = self.get_manage(service_uuid)
        service.is_active = False
        self.db.commit()
        return self.repo.get(service.id)  # type: ignore[arg-type]

    def _sync_features(self, service: Service, rows: list[ServiceFeatureCreate] | None) -> None:
        if not rows:
            return
        for row in rows:
            service.features.append(
                ServiceFeature(
                    blurb=row.text,
                    display_order=row.display_order,
                    is_active=row.is_active,
                )
            )
        self.db.flush()

    def _sync_highlights(self, service: Service, rows: list[ServiceHighlightCreate] | None) -> None:
        if not rows:
            return
        for row in rows:
            service.highlights.append(
                ServiceHighlight(
                    title=row.title,
                    value=row.value,
                    description=row.description,
                    display_order=row.display_order,
                )
            )
        self.db.flush()
