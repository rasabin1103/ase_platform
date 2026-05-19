from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.plan import Plan
from app.models.plan_feature import PlanFeature
from app.modules.plans.repository import PlansRepository
from app.modules.plans.schemas import PlanCreate, PlanFeatureCreate, PlanUpdate


class PlansService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PlansRepository(db)

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

        if payload.features:
            for row in payload.features:
                self._append_feature(plan, row)

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

        if payload.features is not None:
            plan.features.clear()
            self.db.flush()
            for row in payload.features:
                self._append_feature(plan, row)

        self.db.commit()
        return self.repo.get(plan_id)  # type: ignore[arg-type]

    def deactivate(self, plan_id: int) -> Plan:
        plan = self.get(plan_id)
        plan.is_active = False
        self.db.commit()
        return self.repo.get(plan_id)  # type: ignore[arg-type]

    @staticmethod
    def _append_feature(plan: Plan, row: PlanFeatureCreate) -> None:
        plan.features.append(
            PlanFeature(
                blurb=row.text,
                display_order=row.display_order,
                is_active=row.is_active,
            )
        )
