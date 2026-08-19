from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.pricing_engine import calculate_recommended_price, match_dimension_level_for_quantity
from app.models.enums import PricingPillarCode, ServiceCategory, ServiceKind
from app.models.pricing_dimension_level import PricingDimensionLevel
from app.models.pricing_dimension_type import PricingDimensionType
from app.models.pricing_pillar import PricingPillar
from app.models.service import Service
from app.models.service_dimension_selection import ServiceDimensionSelection
from app.models.service_feature import ServiceFeature
from app.models.service_highlight import ServiceHighlight
from app.modules.services.repository import ServicesRepository
from app.modules.services.schemas import (
    DimensionSelectionInput,
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
            price=payload.price,
            is_featured=payload.is_featured,
            is_active=payload.is_active,
            display_order=payload.display_order,
            icon=payload.icon,
            hero_title=payload.hero_title,
            hero_subtitle=payload.hero_subtitle,
            estimated_hours=payload.estimated_hours,
        )
        self._sync_dimension_selections(service, payload.dimension_selections)
        self._apply_pricing(service)
        self.repo.add(service)
        self.db.flush()
        self._sync_features(service, payload.features or [])
        self._sync_highlights(service, payload.highlights or [])
        self.db.commit()
        return self.repo.get(service.id)  # type: ignore[arg-type]

    def update(self, service_uuid: UUID, payload: ServiceUpdate) -> Service:
        service = self.get_manage(service_uuid)

        data = payload.model_dump(exclude_unset=True, exclude={"features", "highlights", "dimension_selections"})
        if "code" in data and data["code"] != service.code:
            if self.repo.get_by_code(data["code"]) is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service code already exists")
        if "slug" in data and data["slug"] != service.slug:
            if self.repo.get_by_slug(data["slug"]) is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Service slug already exists")
        for key, value in data.items():
            setattr(service, key, value)
        if "dimension_selections" in payload.model_fields_set:
            self._sync_dimension_selections(service, payload.dimension_selections or [])
        self._apply_pricing(service)

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

    def _sync_dimension_selections(self, service: Service, selections: list[DimensionSelectionInput]) -> None:
        """Replaces the service's manually-picked dimension selections with
        `selections` — one per dimension type of the service pillar, at
        most. Range-based types ("Horas") are never accepted here; those
        are auto-matched from estimated_hours in _apply_pricing instead."""
        valid_type_ids = {
            t.id
            for t in self.db.execute(
                select(PricingDimensionType).where(
                    PricingDimensionType.pillar_code == PricingPillarCode.service,
                    PricingDimensionType.is_range_based.is_(False),
                )
            ).scalars().all()
        }
        service.dimension_selections = [
            sel for sel in service.dimension_selections if sel.dimension_type_id not in valid_type_ids
        ]
        seen: set[int] = set()
        for inp in selections:
            if inp.dimension_type_id not in valid_type_ids or inp.dimension_type_id in seen:
                continue
            seen.add(inp.dimension_type_id)
            service.dimension_selections.append(
                ServiceDimensionSelection(
                    dimension_type_id=inp.dimension_type_id, dimension_level_id=inp.dimension_level_id
                )
            )

    def _apply_pricing(self, service: Service) -> None:
        """Recomputes and snapshots `recommended_price` from whatever
        dimension_selections/estimated_hours are currently set — best-effort,
        same as CatalogAdminService._apply_pricing. `price` stays the real,
        admin-controlled price. base_price(service pillar) plays the role of
        the hourly rate — recommended_price = hourlyRate × horas ×
        complejidad × especialización × any other selected subelemento."""
        service.recommended_price = None
        pillar_code = PricingPillarCode.service
        pillar = self.db.execute(select(PricingPillar).where(PricingPillar.code == pillar_code)).scalar_one_or_none()
        if pillar is None:
            return

        dimension_types = list(
            self.db.execute(
                select(PricingDimensionType).where(PricingDimensionType.pillar_code == pillar_code)
            ).scalars().all()
        )

        # Range-based types ("Horas") auto-match from estimated_hours,
        # overriding whatever the client selected for that type.
        if service.estimated_hours:
            for dtype in dimension_types:
                if not dtype.is_range_based:
                    continue
                levels = list(
                    self.db.execute(
                        select(PricingDimensionLevel)
                        .where(PricingDimensionLevel.dimension_type_id == dtype.id, PricingDimensionLevel.is_active.is_(True))
                        .order_by(PricingDimensionLevel.min_value)
                    ).scalars().all()
                )
                matched = match_dimension_level_for_quantity(levels, service.estimated_hours)
                service.dimension_selections = [
                    sel for sel in service.dimension_selections if sel.dimension_type_id != dtype.id
                ]
                if matched is not None:
                    service.dimension_selections.append(
                        ServiceDimensionSelection(dimension_type_id=dtype.id, dimension_level_id=matched.id)
                    )

        dimension_multipliers: list[Decimal] = []
        for sel in service.dimension_selections:
            level = self.db.get(PricingDimensionLevel, sel.dimension_level_id)
            if level is not None and level.is_active:
                dimension_multipliers.append(level.multiplier)

        service.recommended_price = calculate_recommended_price(
            base_price=pillar.base_price,
            dimension_multipliers=dimension_multipliers,
        )

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
