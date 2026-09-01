from __future__ import annotations

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
