from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.plan import Plan
from app.models.plan_product import PlanProduct
from app.models.product import Product


class PlanProductsRepository:
    def __init__(self, db: Session):
        self.db = db

    def plan_exists(self, plan_id: int) -> bool:
        stmt = select(func.count()).select_from(Plan).where(Plan.id == plan_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def product_exists(self, product_id: int) -> bool:
        stmt = select(func.count()).select_from(Product).where(Product.id == product_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    def get(self, plan_product_id: int) -> PlanProduct | None:
        stmt = select(PlanProduct).where(PlanProduct.id == plan_product_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_pair(self, *, plan_id: int, product_id: int) -> PlanProduct | None:
        stmt = select(PlanProduct).where(PlanProduct.plan_id == plan_id, PlanProduct.product_id == product_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        plan_id: int | None = None,
        product_id: int | None = None,
    ) -> tuple[list[PlanProduct], int]:
        base = select(PlanProduct)
        if plan_id is not None:
            base = base.where(PlanProduct.plan_id == plan_id)
        if product_id is not None:
            base = base.where(PlanProduct.product_id == product_id)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(PlanProduct.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, pp: PlanProduct) -> PlanProduct:
        self.db.add(pp)
        self.db.flush()
        return pp

    def delete(self, pp: PlanProduct) -> None:
        self.db.delete(pp)

