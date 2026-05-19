from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.plan_product import PlanProduct
from app.modules.plan_products.repository import PlanProductsRepository
from app.modules.plan_products.schemas import PlanProductCreate, PlanProductUpdate


class PlanProductsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PlanProductsRepository(db)

    def create(self, payload: PlanProductCreate) -> PlanProduct:
        if not self.repo.plan_exists(payload.plan_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan not found")
        if not self.repo.product_exists(payload.product_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product not found")

        if self.repo.get_by_pair(plan_id=payload.plan_id, product_id=payload.product_id) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan product already exists")

        pp = PlanProduct(plan_id=payload.plan_id, product_id=payload.product_id, access_level=payload.access_level)
        try:
            self.repo.add(pp)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Plan product already exists")

        self.db.refresh(pp)
        return pp

    def list(
        self,
        *,
        limit: int,
        offset: int,
        plan_id: int | None = None,
        product_id: int | None = None,
    ) -> tuple[list[PlanProduct], int]:
        return self.repo.list(limit=limit, offset=offset, plan_id=plan_id, product_id=product_id)

    def get(self, plan_product_id: int) -> PlanProduct:
        pp = self.repo.get(plan_product_id)
        if pp is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan product not found")
        return pp

    def update(self, plan_product_id: int, payload: PlanProductUpdate) -> PlanProduct:
        pp = self.get(plan_product_id)
        pp.access_level = payload.access_level
        self.db.commit()
        self.db.refresh(pp)
        return pp

    def delete(self, plan_product_id: int) -> None:
        pp = self.get(plan_product_id)
        self.repo.delete(pp)
        self.db.commit()

