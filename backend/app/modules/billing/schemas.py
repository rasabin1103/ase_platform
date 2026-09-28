from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class InvoiceRead(BaseModel):
    """A single Stripe invoice, reshaped for in-app display. Kept minimal
    and UI-oriented (already-formatted currency/status) rather than mirroring
    Stripe's full invoice object."""

    id: str
    number: str | None
    status: str
    amount_paid: float
    currency: str
    created_at: str
    period_start: str | None
    period_end: str | None
    hosted_invoice_url: str | None
    invoice_pdf: str | None
    plan_name: str | None


class InvoiceListResponse(BaseModel):
    items: list[InvoiceRead]


class CheckoutSessionCreate(BaseModel):
    plan_id: int


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class CatalogCheckoutSessionCreate(BaseModel):
    item_slug: str
    # Which language the app was showing when the buyer clicked "Comprar" —
    # picks title_en/short_description_en vs the base (Spanish) fields for
    # the Stripe Checkout line item. Optional and defaults to Spanish
    # server-side: this only affects product_data text and never anything
    # security- or price-relevant, so an old frontend build that doesn't
    # send it yet just gets the previous (Spanish) behavior instead of a
    # validation error.
    language: Literal["es", "en"] | None = None


class CatalogCheckoutSessionResponse(BaseModel):
    checkout_url: str


class BillingPortalResponse(BaseModel):
    portal_url: str


class SubscriptionActionResponse(BaseModel):
    """Returned by cancel/resume so the frontend can update the profile
    page's dates immediately without waiting for a /me refetch."""

    status: str
    starts_at: datetime
    ends_at: datetime | None
    current_period_end: datetime | None


class ChangePlanCreate(BaseModel):
    plan_id: int


class ChangePlanResponse(BaseModel):
    """See BillingService.change_plan — direction is inferred by comparing
    prices: moving to a pricier plan is an "upgrade" applied immediately
    (with a prorated charge for the rest of this period); moving to a
    cheaper one is a "downgrade" scheduled for the start of the next
    billing cycle, per the "Política general de suscripciones" FAQ."""

    direction: Literal["upgrade", "downgrade"]
    effective: Literal["immediate", "next_cycle"]
    new_plan_id: int
    # Only set for a downgrade — the date the new (lower) price actually
    # takes over. Null for an immediate upgrade.
    effective_at: datetime | None = None
