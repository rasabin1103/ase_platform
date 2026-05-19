from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import BillingCycle
from app.models.plan import Plan


class PlansRepository:
    def __init__(self, db: Session):
        self.db = db

    def _plan_options(self):
        return (selectinload(Plan.features),)

    def get(self, plan_id: int) -> Plan | None:
        stmt = select(Plan).options(*self._plan_options()).where(Plan.id == plan_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_code(self, code: str) -> Plan | None:
        stmt = select(Plan).options(*self._plan_options()).where(Plan.code == code)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        is_active: bool | None = None,
        billing_cycle: BillingCycle | None = None,
    ) -> tuple[list[Plan], int]:
        base = select(Plan)
        if is_active is not None:
            base = base.where(Plan.is_active == is_active)
        if billing_cycle is not None:
            base = base.where(Plan.billing_cycle == billing_cycle)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = (
            base.options(*self._plan_options())
            .order_by(Plan.display_order.asc(), Plan.id.asc())
            .limit(limit)
            .offset(offset)
        )
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, plan: Plan) -> Plan:
        self.db.add(plan)
        self.db.flush()
        return plan
