from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select

from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.plan import Plan
from app.models.plan_catalog_item import PlanCatalogItem
from app.modules.plans.repository import PlansRepository
from app.modules.plans.schemas import PlanCreate, PlanUpdate


class PlansService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PlansRepository(db)

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
        )

        self.repo.add(plan)
        self.db.flush()

        if payload.catalog_item_ids:
            self._set_included_catalog_items(plan, payload.catalog_item_ids)

        self.db.commit()
        return self.repo.get(plan.id)  # type: ignore[arg-type]

    def list(self, *, limit: int, offset: int, is_active: bool | None, billing_cycle) -> tuple[list[Plan], int]:
        return self.repo.list(limit=limit, offset=offset, is_active=is_active, billing_cycle=billing_cycle)

    def get(self, plan_id: int) -> Plan:
        plan = self.repo.get(plan_id)
        if plan is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
        return plan

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

        if payload.catalog_item_ids is not None:
            self._set_included_catalog_items(plan, payload.catalog_item_ids)

        self.db.commit()
        return self.repo.get(plan_id)  # type: ignore[arg-type]

    def deactivate(self, plan_id: int) -> Plan:
        plan = self.get(plan_id)
        plan.is_active = False
        self.db.commit()
        return self.repo.get(plan_id)  # type: ignore[arg-type]
