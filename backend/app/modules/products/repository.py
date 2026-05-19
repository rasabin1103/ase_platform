from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import ProductStatus
from app.models.product import Product


class ProductsRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, product_id: int) -> Product | None:
        stmt = select(Product).where(Product.id == product_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_by_code(self, code: str) -> Product | None:
        stmt = select(Product).where(Product.code == code)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *,
        limit: int,
        offset: int,
        status: ProductStatus | None = None,
    ) -> tuple[list[Product], int]:
        base = select(Product)
        if status is not None:
            base = base.where(Product.status == status)

        total_stmt = select(func.count()).select_from(base.subquery())
        total = int(self.db.execute(total_stmt).scalar_one())

        stmt = base.order_by(Product.id.asc()).limit(limit).offset(offset)
        items = list(self.db.execute(stmt).scalars().all())
        return items, total

    def add(self, product: Product) -> Product:
        self.db.add(product)
        self.db.flush()
        return product

