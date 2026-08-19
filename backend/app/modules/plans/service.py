from __future__ import annotations

from decimal import ROUND_DOWN, Decimal

from fastapi import HTTPException, status
from sqlalchemy import select

from sqlalchemy.orm import Session

from app.core.translation import translate_es_to_en
from app.models.catalog_item import CatalogItem
from app.models.plan import Plan
from app.models.plan_catalog_item import PlanCatalogItem
from app.modules.plans.repository import PlansRepository
from app.modules.plans.schemas import PlanCreate, PlanUpdate

_EN_FIELD_PAIRS = (
    ("name", "name_en"),
    ("short_description", "short_description_en"),
    ("description", "description_en"),
    ("cta_label", "cta_label_en"),
)

_ANNUAL_DISCOUNT_MIN = Decimal("0.03")  # cheapest paid plan
_ANNUAL_DISCOUNT_MAX = Decimal("0.07")  # most expensive paid plan


class PlansService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PlansRepository(db)

    def _paid_discount_ladder(self) -> dict[int, Decimal]:
        """Every currently active plan with a real (non-custom, > 0) price,
        ranked cheapest to priciest, gets a linearly interpolated annual
        discount from 3% (cheapest) to 7% (most expensive) — with exactly
        two paid plans that's simply 3% and 7%; a third paid plan added
        later would land at 5% automatically, no manual tuning needed."""
        active, _ = self.repo.list(limit=1000, offset=0, is_active=True, billing_cycle=None)
        paid = sorted(
            (p for p in active if p.price is not None and p.price > 0),
            key=lambda p: p.price,
        )
        ladder: dict[int, Decimal] = {}
        n = len(paid)
        if n == 0:
            return ladder
        if n == 1:
            ladder[paid[0].id] = _ANNUAL_DISCOUNT_MIN
            return ladder
        step = (_ANNUAL_DISCOUNT_MAX - _ANNUAL_DISCOUNT_MIN) / (n - 1)
        for idx, p in enumerate(paid):
            ladder[p.id] = _ANNUAL_DISCOUNT_MIN + step * idx
        return ladder

    def _attach_annual_price(self, plan: Plan | None, ladder: dict[int, Decimal] | None = None) -> Plan | None:
        if plan is None:
            return None
        if ladder is None:
            ladder = self._paid_discount_ladder()
        discount = ladder.get(plan.id)
        if plan.price is not None and plan.price > 0 and discount is not None:
            raw = plan.price * 12 * (Decimal("1") - discount)
            # `annual_price` is not a mapped column — it's set as a plain
            # instance attribute purely so PlanRead (from_attributes=True)
            # can read it off the object, same as any other field. Rounded
            # down to a whole currency unit (never up) so the advertised
            # annual price always reads as a clean, round number.
            plan.annual_price = raw.quantize(Decimal("1"), rounding=ROUND_DOWN)
        else:
            plan.annual_price = None
        return plan

    def _attach_annual_prices(self, plans: list[Plan]) -> list[Plan]:
        ladder = self._paid_discount_ladder()
        for p in plans:
            self._attach_annual_price(p, ladder)
        return plans

    def _resolve_catalog_items(self, catalog_item_ids: list[int]) -> list[CatalogItem]:
        if not catalog_item_ids:
            return []
        rows = {
            row.id: row
            for row in self.db.execute(select(CatalogItem).where(CatalogItem.id.in_(catalog_item_ids))).scalars()
        }
        missing = [cid for cid in catalog_item_ids if cid not in rows]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Catalog item id(s) not found: {', '.join(str(m) for m in missing)}",
            )
        # Preserve the order the admin picked them in, de-duplicated.
        seen: set[int] = set()
        ordered: list[CatalogItem] = []
        for cid in catalog_item_ids:
            if cid in seen:
                continue
            seen.add(cid)
            ordered.append(rows[cid])
        return ordered

    def _ensure_english_fields(self, plan: Plan, payload: PlanCreate | PlanUpdate, *, changed_es: dict[str, bool]) -> None:
        """Fills plan.<field>_en for every field where either (a) the admin
        passed an explicit English override, or (b) the Spanish source text
        changed in this call and needs a fresh translation. Falls back to
        mirroring the Spanish text when translation is unavailable (no
        DEEPL_API_KEY configured, or the API call fails) so the English
        site is never left blank — saving a plan can never fail because of
        this step."""
        for es_field, en_field in _EN_FIELD_PAIRS:
            override = getattr(payload, en_field, None)
            if override is not None:
                setattr(plan, en_field, override)
                continue
            if not changed_es.get(es_field, False):
                continue
            es_value = getattr(plan, es_field, None)
            translated = translate_es_to_en(es_value)
            setattr(plan, en_field, translated if translated is not None else es_value)

    def _set_included_catalog_items(self, plan: Plan, catalog_item_ids: list[int]) -> None:
        items = self._resolve_catalog_items(catalog_item_ids)
        plan.included_catalog_items.clear()
        self.db.flush()
        for order, item in enumerate(items):
            plan.included_catalog_items.append(
                PlanCatalogItem(catalog_item_id=item.id, display_order=order)
            )

    def create(self, payload: PlanCreate) -> Plan:
        if self.repo.get_by_code(payload.code) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan code already exists")

        plan = Plan(
            code=payload.code,
            name=payload.name,
            billing_cycle=payload.billing_cycle,
            price=payload.price,
            currency=payload.currency,
            is_active=payload.is_active,
            description=payload.description,
            short_description=payload.short_description,
            display_order=payload.display_order,
            is_recommended=payload.is_recommended,
            cta_label=payload.cta_label,
            stripe_price_id=payload.stripe_price_id,
        )

        self.repo.add(plan)
        self.db.flush()

        if payload.catalog_item_ids:
            self._set_included_catalog_items(plan, payload.catalog_item_ids)

        self._ensure_english_fields(
            plan,
            payload,
            changed_es={"name": True, "short_description": True, "description": True, "cta_label": True},
        )

        self.db.commit()
        return self._attach_annual_price(self.repo.get(plan.id))  # type: ignore[return-value]

    def list(self, *, limit: int, offset: int, is_active: bool | None, billing_cycle) -> tuple[list[Plan], int]:
        items, total = self.repo.list(limit=limit, offset=offset, is_active=is_active, billing_cycle=billing_cycle)
        return self._attach_annual_prices(items), total

    def get(self, plan_id: int) -> Plan:
        plan = self.repo.get(plan_id)
        if plan is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
        return self._attach_annual_price(plan)  # type: ignore[return-value]

    def update(self, plan_id: int, payload: PlanUpdate) -> Plan:
        plan = self.get(plan_id)

        if payload.code is not None and payload.code != plan.code:
            if self.repo.get_by_code(payload.code) is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan code already exists")
            plan.code = payload.code

        if payload.name is not None:
            plan.name = payload.name
        if payload.billing_cycle is not None:
            plan.billing_cycle = payload.billing_cycle
        if payload.price is not None:
            plan.price = payload.price
        if payload.currency is not None:
            plan.currency = payload.currency
        if payload.is_active is not None:
            plan.is_active = payload.is_active
        if payload.description is not None:
            plan.description = payload.description
        if payload.short_description is not None:
            plan.short_description = payload.short_description
        if payload.display_order is not None:
            plan.display_order = payload.display_order
        if payload.is_recommended is not None:
            plan.is_recommended = payload.is_recommended
        if payload.cta_label is not None:
            plan.cta_label = payload.cta_label
        if payload.stripe_price_id is not None:
            plan.stripe_price_id = payload.stripe_price_id

        if payload.catalog_item_ids is not None:
            self._set_included_catalog_items(plan, payload.catalog_item_ids)

        self._ensure_english_fields(
            plan,
            payload,
            changed_es={
                "name": payload.name is not None,
                "short_description": payload.short_description is not None,
                "description": payload.description is not None,
                "cta_label": payload.cta_label is not None,
            },
        )

        self.db.commit()
        return self._attach_annual_price(self.repo.get(plan_id))  # type: ignore[return-value]

    def deactivate(self, plan_id: int) -> Plan:
        plan = self.get(plan_id)
        plan.is_active = False
        self.db.commit()
        return self._attach_annual_price(self.repo.get(plan_id))  # type: ignore[return-value]
