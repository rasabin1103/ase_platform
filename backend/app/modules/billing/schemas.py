from __future__ import annotations

from pydantic import BaseModel


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
