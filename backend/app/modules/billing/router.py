from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_active_user
from app.modules.billing.schemas import (
    BillingPortalResponse,
    CatalogCheckoutSessionCreate,
    CatalogCheckoutSessionResponse,
    CheckoutSessionCreate,
    CheckoutSessionResponse,
    InvoiceListResponse,
)
from app.modules.billing.service import BillingError, BillingService

router = APIRouter(prefix="/api/v1/billing", tags=["billing"])


def get_service(db: Session = Depends(get_db)) -> BillingService:
    return BillingService(db)


@router.post("/checkout-session", response_model=CheckoutSessionResponse)
def create_checkout_session(
    payload: CheckoutSessionCreate,
    current_user: User = Depends(get_current_active_user),
    svc: BillingService = Depends(get_service),
):
    try:
        checkout_url = svc.create_checkout_session(current_user=current_user, plan_id=payload.plan_id)
    except BillingError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return CheckoutSessionResponse(checkout_url=checkout_url)


@router.post("/catalog-checkout-session", response_model=CatalogCheckoutSessionResponse)
def create_catalog_checkout_session(
    payload: CatalogCheckoutSessionCreate,
    current_user: User = Depends(get_current_active_user),
    svc: BillingService = Depends(get_service),
):
    try:
        checkout_url = svc.create_catalog_checkout_session(
            current_user=current_user, item_slug=payload.item_slug, language=payload.language
        )
    except BillingError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return CatalogCheckoutSessionResponse(checkout_url=checkout_url)


@router.get("/invoices", response_model=InvoiceListResponse)
def list_invoices(
    current_user: User = Depends(get_current_active_user),
    svc: BillingService = Depends(get_service),
):
    # Returns an empty list (not an error) when Stripe isn't configured or
    # the org has no Stripe customer yet — the frontend just shows an empty
    # state rather than an error banner for the common "never subscribed"
    # case.
    try:
        items = svc.list_invoices(current_user=current_user)
    except HTTPException:
        return InvoiceListResponse(items=[])
    return InvoiceListResponse(items=items)


@router.post("/portal-session", response_model=BillingPortalResponse)
def create_portal_session(
    current_user: User = Depends(get_current_active_user),
    svc: BillingService = Depends(get_service),
):
    try:
        portal_url = svc.create_portal_session(current_user=current_user)
    except BillingError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return BillingPortalResponse(portal_url=portal_url)


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    svc: BillingService = Depends(get_service),
):
    # No auth dependency here on purpose — this endpoint is called by
    # Stripe's own servers, not a logged-in user. Authenticity is verified
    # instead via the `stripe-signature` header inside `handle_webhook`
    # (rejects anything not signed with STRIPE_WEBHOOK_SECRET).
    await svc.handle_webhook(request)
    return {"received": True}
