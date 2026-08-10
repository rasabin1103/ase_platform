from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.plans.schemas import PlanListResponse, PlanRead
from app.modules.public_catalog.schemas import (
    CaseStudyPublic,
    CatalogStatsResponse,
    TeamMemberPublic,
    TestimonialPublic,
)
from app.modules.public_catalog.service import (
    get_catalog_stats,
    get_public_pricing_plans,
    list_active_case_studies,
    list_active_team_members,
    list_active_testimonials,
)

router = APIRouter(prefix="/api/v1/public", tags=["public"])


@router.get("/catalog-pricing-plans", response_model=PlanListResponse, tags=["public"])
def list_catalog_pricing_plans(
    limit: int = Query(default=200, ge=1, le=200),
    db: Session = Depends(get_db),
) -> PlanListResponse:
    """Active plans for public marketing / pricing UI (no auth)."""
    items, total = get_public_pricing_plans(db)
    return PlanListResponse(
        items=[PlanRead.model_validate(item) for item in items[:limit]],
        limit=limit,
        offset=0,
        total=total,
    )


@router.get(
    "/catalog-stats",
    response_model=CatalogStatsResponse,
    tags=["public-catalog-stats"],
)
def read_catalog_stats(db: Session = Depends(get_db)) -> CatalogStatsResponse:
    """Aggregate public catalog counts and platform health (no auth)."""
    return get_catalog_stats(db)


@router.get("/team", response_model=list[TeamMemberPublic], tags=["public"])
def read_public_team(db: Session = Depends(get_db)) -> list[TeamMemberPublic]:
    """Active (confirmed) team members only — no auth."""
    return [TeamMemberPublic.model_validate(m) for m in list_active_team_members(db)]


@router.get("/testimonials", response_model=list[TestimonialPublic], tags=["public"])
def read_public_testimonials(db: Session = Depends(get_db)) -> list[TestimonialPublic]:
    """Active (confirmed real) testimonials only — no auth."""
    return [TestimonialPublic.model_validate(t) for t in list_active_testimonials(db)]


@router.get("/case-studies", response_model=list[CaseStudyPublic], tags=["public"])
def read_public_case_studies(db: Session = Depends(get_db)) -> list[CaseStudyPublic]:
    """Active (confirmed real) case studies only — no auth."""
    return [CaseStudyPublic.model_validate(c) for c in list_active_case_studies(db)]
