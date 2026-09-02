from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.media_urls import catalog_has_stored_image
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
    get_published_catalog_item_or_404,
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


@router.get("/catalog-cover/{item_id}", tags=["public"])
def read_public_catalog_cover_image(item_id: int, db: Session = Depends(get_db)) -> Response:
    """Binary cover image for a published catalog item — no auth. Exists
    solely so a third party with no session of its own (Stripe, fetching a
    Checkout line item's product image) can load it; the app's own <img>
    tags keep using the authenticated /media/catalog/{id}/image instead. See
    media_urls.resolve_catalog_stripe_image_url."""
    item = get_published_catalog_item_or_404(db, item_id)
    if not catalog_has_stored_image(item):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    # See the matching comment in media/router.py: caching this cuts repeat
    # Supabase DB egress from re-fetching the same unchanged image bytes.
    return Response(
        content=bytes(item.image_data),
        media_type=item.image_mime or "image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"},
    )
