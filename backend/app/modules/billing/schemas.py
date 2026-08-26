from __future__ import annotations

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


class CatalogCheckoutSessionResponse(BaseModel):
    checkout_url: str


class BillingPortalResponse(BaseModel):
    portal_url: str
