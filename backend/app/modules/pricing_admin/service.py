from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import PricingPillarCode
from app.models.pricing_dimension_level import PricingDimensionLevel
from app.models.pricing_dimension_type import PricingDimensionType
from app.models.pricing_pillar import PricingPillar
from app.modules.pricing_admin.schemas import (
    PricingConfigResponse,
    PricingDimensionLevelCreate,
    PricingDimensionLevelListResponse,
    PricingDimensionLevelRead,
    PricingDimensionLevelUpdate,
    PricingDimensionTypeConfig,
    PricingDimensionTypeCreate,
    PricingDimensionTypeListResponse,
    PricingDimensionTypeRead,
    PricingDimensionTypeUpdate,
    PricingPillarConfig,
    PricingPillarUpdate,
)

# Fixed display order for the 5 structural pillars — not alphabetical, so
# the admin UI always groups them the same way the user described them
# ("producto, book, cursos, recursos y servicios").
_PILLAR_ORDER: list[PricingPillarCode] = [
    PricingPillarCode.product,
    PricingPillarCode.course,
    PricingPillarCode.book,
    PricingPillarCode.resource,
    PricingPillarCode.service,
]

# Per pillar: the dimension types every environment should have at minimum
# (code, label, is_range_based) — every one of them is a "subelemento" that
# multiplies into the final price, base_price(pillar) × Π(these). Mirrors
# the formulas the platform owner specified:
#   product  = base × subtipo × complejidad × funcionalidad × mantenimiento
#   course   = base × subtipo × complejidad × duración × especialización
#   book     = base × subtipo × páginas × especialización
#   resource = base × subtipo × complejidad × valor
#   service  = horas × tarifa/hora(=base) × complejidad × especialización
# "subtipo" is seeded for every pillar (including service) purely as an
# always-available extra slot — see PricingPillarConfig docstring — and the
# admin can still add further custom dimension types on top of any of
# these via the CRUD below. Idempotently seeded on every read, same
# philosophy as ensure_pillars_seeded — self-heals regardless of migration
# timing.
_SEED_DIMENSION_TYPES: dict[PricingPillarCode, list[tuple[str, str, bool]]] = {
    PricingPillarCode.product: [
        ("subtipo", "Subtipo", False),
        ("complejidad", "Complejidad", False),
        ("funcionalidad", "Funcionalidad", False),
        ("mantenimiento", "Mantenimiento", False),
    ],
    PricingPillarCode.course: [
        ("subtipo", "Subtipo", False),
        ("complejidad", "Complejidad", False),
        ("duracion", "Duración", False),
        ("especializacion", "Especialización", False),
    ],
    PricingPillarCode.book: [
        ("subtipo", "Subtipo", False),
        ("paginas", "Páginas", True),
        ("especializacion", "Especialización", False),
    ],
    PricingPillarCode.resource: [
        ("subtipo", "Subtipo", False),
        ("complejidad", "Complejidad", False),
        ("valor", "Valor", False),
    ],
    PricingPillarCode.service: [
        ("subtipo", "Subtipo", False),
        ("horas", "Horas", True),
        ("complejidad", "Complejidad", False),
        ("especializacion", "Especialización", False),
    ],
}


class PricingAdminService:
    def __init__(self, db: Session):
        self.db = db

    # --- Pillars -------------------------------------------------------

    def ensure_pillars_seeded(self) -> dict[PricingPillarCode, PricingPillar]:
        """Idempotently guarantees exactly one row per pillar code exists.
        Called on every read so the table self-heals regardless of when
        this feature was deployed relative to any given environment — no
        fragile data migration needed."""
        existing = {p.code: p for p in self.db.execute(select(PricingPillar)).scalars().all()}
        for code in _PILLAR_ORDER:
            if code not in existing:
                pillar = PricingPillar(code=code, base_price=Decimal("0.00"))
                self.db.add(pillar)
                existing[code] = pillar
        self.db.commit()
        return existing

    def _require_pillar(self, code: PricingPillarCode) -> PricingPillar:
        pillars = self.ensure_pillars_seeded()
        return pillars[code]

    def update_pillar_base_price(self, code: PricingPillarCode, payload: PricingPillarUpdate) -> PricingPillar:
        pillar = self._require_pillar(code)
        pillar.base_price = payload.base_price
        self.db.commit()
        self.db.refresh(pillar)
        return pillar

    # --- Dimension types -------------------------------------------------

    def ensure_dimension_types_seeded(self) -> list[PricingDimensionType]:
        """Idempotently guarantees the minimum set of dimension types per
        pillar exists (by pillar_code + code) — same self-healing pattern
        as ensure_pillars_seeded. Never removes or edits an existing type,
        so admin-entered labels/order/multipliers on top are preserved."""
        existing_codes = {
            (row.pillar_code, row.code)
            for row in self.db.execute(select(PricingDimensionType)).scalars().all()
        }
        for pillar, entries in _SEED_DIMENSION_TYPES.items():
            for order, (code, label, is_range_based) in enumerate(entries):
                if (pillar, code) not in existing_codes:
                    self.db.add(
                        PricingDimensionType(
                            pillar_code=pillar,
                            code=code,
                            label=label,
                            is_range_based=is_range_based,
                            display_order=order,
                        )
                    )
        self.db.commit()
        return list(self.db.execute(select(PricingDimensionType)).scalars().all())

    def _require_dimension_type(self, dimension_type_id: int) -> PricingDimensionType:
        row = self.db.get(PricingDimensionType, dimension_type_id)
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing dimension type not found")
        return row

    def list_dimension_types(self, *, pillar_code: PricingPillarCode | None) -> PricingDimensionTypeListResponse:
        self.ensure_dimension_types_seeded()
        stmt = select(PricingDimensionType).order_by(
            PricingDimensionType.pillar_code, PricingDimensionType.display_order, PricingDimensionType.label
        )
        if pillar_code is not None:
            stmt = stmt.where(PricingDimensionType.pillar_code == pillar_code)
        rows = list(self.db.execute(stmt).scalars().all())
        return PricingDimensionTypeListResponse(items=[PricingDimensionTypeRead.model_validate(r) for r in rows])

    def create_dimension_type(self, payload: PricingDimensionTypeCreate) -> PricingDimensionType:
        exists = self.db.execute(
            select(PricingDimensionType).where(
                PricingDimensionType.pillar_code == payload.pillar_code,
                PricingDimensionType.code == payload.code,
            )
        ).scalar_one_or_none()
        if exists is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A dimension type with this code already exists for this pillar",
            )
        row = PricingDimensionType(
            pillar_code=payload.pillar_code,
            code=payload.code,
            label=payload.label,
            is_range_based=payload.is_range_based,
            display_order=payload.display_order,
            is_active=payload.is_active,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def update_dimension_type(self, dimension_type_id: int, payload: PricingDimensionTypeUpdate) -> PricingDimensionType:
        row = self._require_dimension_type(dimension_type_id)
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(row, key, value)
        self.db.commit()
        self.db.refresh(row)
        return row

    def delete_dimension_type(self, dimension_type_id: int) -> None:
        row = self._require_dimension_type(dimension_type_id)
        self.db.delete(row)
        self.db.commit()

    # --- Full config (used by both the admin page and the item/service forms) -

    def get_config(self) -> PricingConfigResponse:
        pillars = self.ensure_pillars_seeded()
        dimension_types = self.ensure_dimension_types_seeded()
        levels = list(
            self.db.execute(
                select(PricingDimensionLevel).order_by(
                    PricingDimensionLevel.display_order, PricingDimensionLevel.min_value
                )
            ).scalars().all()
        )
        levels_by_type: dict[int, list[PricingDimensionLevel]] = {}
        for level in levels:
            levels_by_type.setdefault(level.dimension_type_id, []).append(level)

        types_by_pillar: dict[PricingPillarCode, list[PricingDimensionType]] = {}
        for dtype in dimension_types:
            types_by_pillar.setdefault(dtype.pillar_code, []).append(dtype)
        for entries in types_by_pillar.values():
            entries.sort(key=lambda d: (d.display_order, d.label))

        result: list[PricingPillarConfig] = []
        for code in _PILLAR_ORDER:
            result.append(
                PricingPillarConfig(
                    code=code,
                    base_price=pillars[code].base_price,
                    dimension_types=[
                        PricingDimensionTypeConfig(
                            id=dtype.id,
                            uuid=dtype.uuid,
                            code=dtype.code,
                            label=dtype.label,
                            is_range_based=dtype.is_range_based,
                            display_order=dtype.display_order,
                            is_active=dtype.is_active,
                            levels=[
                                PricingDimensionLevelRead.model_validate(lvl)
                                for lvl in levels_by_type.get(dtype.id, [])
                            ],
                        )
                        for dtype in types_by_pillar.get(code, [])
                    ],
                )
            )
        return PricingConfigResponse(pillars=result)

    # --- Dimension levels --------------------------------------------------

    def _require_dimension_level(self, level_id: int) -> PricingDimensionLevel:
        row = self.db.get(PricingDimensionLevel, level_id)
        if row is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pricing dimension level not found")
        return row

    def list_dimension_levels(self, *, dimension_type_id: int | None) -> PricingDimensionLevelListResponse:
        stmt = select(PricingDimensionLevel).order_by(
            PricingDimensionLevel.display_order, PricingDimensionLevel.min_value
        )
        if dimension_type_id is not None:
            stmt = stmt.where(PricingDimensionLevel.dimension_type_id == dimension_type_id)
        rows = list(self.db.execute(stmt).scalars().all())
        return PricingDimensionLevelListResponse(items=[PricingDimensionLevelRead.model_validate(r) for r in rows])

    def create_dimension_level(self, payload: PricingDimensionLevelCreate) -> PricingDimensionLevel:
        self._require_dimension_type(payload.dimension_type_id)
        row = PricingDimensionLevel(
            dimension_type_id=payload.dimension_type_id,
            label=payload.label,
            multiplier=payload.multiplier,
            min_value=payload.min_value,
            max_value=payload.max_value,
            display_order=payload.display_order,
            is_active=payload.is_active,
        )
        self.db.add(row)
        self.db.commit()
        self.db.refresh(row)
        return row

    def update_dimension_level(self, level_id: int, payload: PricingDimensionLevelUpdate) -> PricingDimensionLevel:
        row = self._require_dimension_level(level_id)
        data = payload.model_dump(exclude_unset=True)
        next_min = data.get("min_value", row.min_value)
        next_max = data.get("max_value", row.max_value)
        if next_min is not None and next_max is not None and next_max < next_min:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="max_value must be greater than or equal to min_value",
            )
        for key, value in data.items():
            setattr(row, key, value)
        self.db.commit()
        self.db.refresh(row)
        return row

    def delete_dimension_level(self, level_id: int) -> None:
        row = self._require_dimension_level(level_id)
        self.db.delete(row)
        self.db.commit()
