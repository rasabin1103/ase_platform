from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.enums import ProductStatus
from app.models.product import Product
from app.modules.products.repository import ProductsRepository
from app.modules.products.schemas import ProductCreate, ProductUpdate


class ProductsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProductsRepository(db)

    def create(self, payload: ProductCreate) -> Product:
        if self.repo.get_by_code(payload.code) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product code already exists")

        product = Product(
            code=payload.code,
            name=payload.name,
            description=payload.description,
            status=payload.status,
            owner_user_id=payload.owner_user_id,
        )
        self.repo.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def list(self, *, limit: int, offset: int, status: ProductStatus | None) -> tuple[list[Product], int]:
        return self.repo.list(limit=limit, offset=offset, status=status)

    def get(self, product_id: int) -> Product:
        product = self.repo.get(product_id)
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product

    def update(self, product_id: int, payload: ProductUpdate) -> Product:
        product = self.get(product_id)

        if payload.code is not None and payload.code != product.code:
            if self.repo.get_by_code(payload.code) is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product code already exists")
            product.code = payload.code

        if payload.name is not None:
            product.name = payload.name
        if payload.description is not None:
            product.description = payload.description
        if payload.status is not None:
            product.status = payload.status

        self.db.commit()
        self.db.refresh(product)
        return product

    def deactivate(self, product_id: int) -> Product:
        product = self.get(product_id)
        product.status = ProductStatus.inactive
        self.db.commit()
        self.db.refresh(product)
        return product

