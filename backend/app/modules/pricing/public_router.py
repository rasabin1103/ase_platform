"""Public catalog pricing plans (no auth; active plans for published items only)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.pricing.schemas import PublicCatalogPricingPlanListResponse
from app.modules.pricing.service import PricingPlansService

router = APIRouter(prefix="/api/v1/public", tags=["public-catalog-pricing"])


def get_service(db: Session = Depends(get_db)) -> PricingPlansService:
    return PricingPlansService(db)


@router.get("/catalog-pricing-plans", response_model=PublicCatalogPricingPlanListResponse)
def list_public_catalog_pricing_plans(
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    svc: PricingPlansService = Depends(get_service),
):
    return svc.list_public_active(limit=limit, offset=offset)
