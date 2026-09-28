from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.media_urls import catalog_has_stored_image
from app.core.rate_limit import limiter
from app.core.turnstile import verify_turnstile_token
from app.modules.plans.schemas import PlanListResponse, PlanRead
from app.modules.public_catalog.schemas import (
    CaseStudyPublic,
    CatalogStatsResponse,
    ContactMessageCreate,
    ContactMessageResponse,
    PlanSavingsListResponse,
    TeamMemberPublic,
    TestimonialPublic,
)
from app.modules.public_catalog.service import (
    get_catalog_stats,
    get_plan_savings,
    get_public_pricing_plans,
    get_published_catalog_item_or_404,
    list_active_case_studies,
    list_active_team_members,
    list_active_testimonials,
    send_contact_message,
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


@router.get("/catalog-stats", response_model=CatalogStatsResponse, tags=["public-catalog-stats"])
def read_catalog_stats(db: Session = Depends(get_db)) -> CatalogStatsResponse:
    """Aggregate public catalog counts and platform health (no auth)."""
    return get_catalog_stats(db)


@router.get("/plan-savings", response_model=PlanSavingsListResponse, tags=["public"])
def read_plan_savings(
    item_slug: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> PlanSavingsListResponse:
    return PlanSavingsListResponse(items=get_plan_savings(db, item_slug=item_slug))


@router.get("/team", response_model=list[TeamMemberPublic], tags=["public"])
def read_public_team(db: Session = Depends(get_db)) -> list[TeamMemberPublic]:
    """Active (confirmed) team members only — no auth."""
    return [TeamMemberPublic.model_validate(m) for m in list_active_team_members(db)]


@router.get("/testimonials", response_model=list[TestimonialPublic], tags=["public"])
def read_public_testimonials(db: Session = Depends(get_db)) -> list[TestimonialPublic]:
    return [TestimonialPublic.model_validate(t) for t in list_active_testimonials(db)]


@router.get("/case-studies", response_model=list[CaseStudyPublic], tags=["public"])
def read_public_case_studies(db: Session = Depends(get_db)) -> list[CaseStudyPublic]:
    return [CaseStudyPublic.model_validate(c) for c in list_active_case_studies(db)]


@router.post("/contact", response_model=ContactMessageResponse, tags=["public"])
@limiter.limit("5/hour")
async def submit_contact_message(
    request: Request, payload: ContactMessageCreate,
) -> ContactMessageResponse:
    """The public /contact form — sends straight to the admin mailbox (see
    send_contact_message), same captcha + rate-limit pattern as /auth/register
    since this is another unauthenticated, mutation-triggering public
    endpoint. Always reports ok, even if SMTP isn't configured or the send
    failed — a delivery hiccup on our side isn't the visitor's problem, and
    the page still shows the direct mailto: link as a fallback."""
    remote_ip = request.client.host if request.client else None
    if not await verify_turnstile_token(payload.turnstile_token, remote_ip):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="captcha_failed")
    send_contact_message(payload)
    return ContactMessageResponse(ok=True)


@router.get("/catalog-cover/{item_id}", tags=["public"])
def read_public_catalog_cover_image(item_id: int, db: Session = Depends(get_db)) -> Response:
    """Binary cover image for a published catalog item — no auth. Exists
    solely so a third party with no session of its own (Stripe, fetching a
    Checkout line item's product image) can load it; the app's own <img>
    tags keep using the authenticated /media/catalog/{id}/image instead.
    See media_urls.resolve_catalog_stripe_image_url."""
    item = get_published_catalog_item_or_404(db, item_id)
    if not catalog_has_stored_image(item):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    return Response(
        content=bytes(item.image_data),
        media_type=item.image_mime or "image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"},
    )
