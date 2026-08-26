from __future__ import annotations

import logging
from datetime import datetime, timezone

import stripe
from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.config import settings
from app.core.creator import ensure_personal_workspace
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemStatus, MembershipStatus, SubscriptionProvider, SubscriptionStatus
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.modules.auth.dependencies import get_default_organization_id
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository

logger = logging.getLogger(__name__)

# Stripe subscription statuses -> our SubscriptionStatus. Stripe has a couple
# of extra intermediate states (incomplete, incomplete_expired, unpaid) that
# don't have a clean equivalent in our (deliberately small) enum; they're
# folded into the closest existing status rather than growing the enum for
# states our UI doesn't yet distinguish.
_STRIPE_STATUS_MAP: dict[str, SubscriptionStatus] = {
    "trialing": SubscriptionStatus.trialing,
    "active": SubscriptionStatus.active,
    "past_due": SubscriptionStatus.past_due,
    "canceled": SubscriptionStatus.canceled,
    "unpaid": SubscriptionStatus.past_due,
    "incomplete": SubscriptionStatus.past_due,
    "incomplete_expired": SubscriptionStatus.expired,
}


def _require_stripe_configured() -> None:
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe billing is not configured on this server.",
        )
    stripe.api_key = settings.STRIPE_SECRET_KEY


class BillingError(Exception):
    """Raised for any client-correctable failure — the router turns this
    into an HTTP 400."""


class BillingService:
    def __init__(self, db: Session):
        self.db = db

    def _get_or_create_stripe_customer(self, org: Organization, user: User) -> str:
        if org.stripe_customer_id:
            return org.stripe_customer_id

        customer = stripe.Customer.create(
            email=user.email,
            name=org.name,
            metadata={"organization_id": str(org.id), "organization_uuid": str(org.uuid)},
        )
        org.stripe_customer_id = customer.id
        self.db.flush()
        return customer.id

    def create_checkout_session(self, *, current_user: User, plan_id: int) -> str:
        _require_stripe_configured()

        # Backfill for any account that predates ensure_personal_workspace
        # being called at registration — a no-op if they already have one.
        ensure_personal_workspace(self.db, user_id=current_user.id)
        self.db.commit()

        org_id = get_default_organization_id(self.db, current_user)
        if org_id is None:
            raise BillingError("No workspace is associated with this user.")
        org = self.db.get(Organization, org_id)
        if org is None:
            raise BillingError("Organization not found.")

        plan = self.db.get(Plan, plan_id)
        if plan is None or not plan.is_active:
            raise BillingError("Plan not found or inactive.")
        if not plan.stripe_price_id:
            raise BillingError("This plan is not yet sellable online (missing Stripe price).")

        customer_id = self._get_or_create_stripe_customer(org, current_user)

        session = stripe.checkout.Session.create(
            mode="subscription",
            customer=customer_id,
            line_items=[{"price": plan.stripe_price_id, "quantity": 1}],
            success_url=f"{settings.FRONTEND_URL}/dashboard?checkout=success",
            cancel_url=f"{settings.FRONTEND_URL}/admin/plans?checkout=cancelled",
            client_reference_id=str(org.id),
            metadata={"organization_id": str(org.id), "plan_id": str(plan.id)},
            subscription_data={"metadata": {"organization_id": str(org.id), "plan_id": str(plan.id)}},
        )
        self.db.commit()

        record_audit_log(
            self.db,
            actor_user_id=current_user.id,
            action="billing.checkout_session_created",
            entity_type="plan",
            entity_id=str(plan.id),
            organization_id=org.id,
            metadata={"stripe_checkout_session_id": session.id},
        )

        if not session.url:
            raise BillingError("Stripe did not return a checkout URL.")
        return session.url

    def create_catalog_checkout_session(self, *, current_user: User, item_slug: str) -> str:
        """One-time payment Checkout for a single priced catalog item. This
        is the only path that can grant a priced item — the direct
        POST /consumer-catalog/{slug}/purchase endpoint refuses anything
        with price > 0 (see ConsumerCatalogService.purchase), so there's no
        way to end up with access to a paid item without actually paying
        for it through here."""
        _require_stripe_configured()

        item = self.db.execute(select(CatalogItem).where(CatalogItem.slug == item_slug)).scalar_one_or_none()
        if item is None:
            raise BillingError("Catalog item not found.")
        if item.status == CatalogItemStatus.coming_soon:
            raise BillingError("Item is not available for purchase yet.")
        if item.status == CatalogItemStatus.request_only:
            raise BillingError("This item requires an access request instead of a direct purchase.")
        if item.price is None or item.price <= 0:
            raise BillingError("This item is free — use the direct purchase endpoint instead of checkout.")

        ensure_personal_workspace(self.db, user_id=current_user.id)
        self.db.commit()

        org_id = get_default_organization_id(self.db, current_user)
        if org_id is None:
            raise BillingError("No workspace is associated with this user.")
        org = self.db.get(Organization, org_id)
        if org is None:
            raise BillingError("Organization not found.")

        customer_id = self._get_or_create_stripe_customer(org, current_user)
        unit_amount = int((item.price * 100).to_integral_value())

        session = stripe.checkout.Session.create(
            mode="payment",
            customer=customer_id,
            line_items=[
                {
                    "price_data": {
                        "currency": item.currency.lower(),
                        "unit_amount": unit_amount,
                        "product_data": {"name": item.title},
                    },
                    "quantity": 1,
                }
            ],
            success_url=f"{settings.FRONTEND_URL}/catalog/{item.type.value}/{item.slug}?checkout=success",
            cancel_url=f"{settings.FRONTEND_URL}/catalog/{item.type.value}/{item.slug}?checkout=cancelled",
            metadata={"catalog_item_id": str(item.id), "user_id": str(current_user.id)},
        )
        self.db.commit()

        record_audit_log(
            self.db,
            actor_user_id=current_user.id,
            action="billing.catalog_checkout_session_created",
            entity_type="catalog_item",
            entity_id=str(item.id),
            organization_id=org.id,
            metadata={"stripe_checkout_session_id": session.id},
        )

        if not session.url:
            raise BillingError("Stripe did not return a checkout URL.")
        return session.url

    def list_invoices(self, *, current_user: User) -> list[dict]:
        """Returns the organization's Stripe invoices reshaped for in-app
        display — used by the branded "Facturación" view so returning
        clients see their receipt history inside ASE's own UI instead of
        always being bounced to Stripe's hosted portal. The actual PDF/
        hosted invoice page still lives on Stripe (hosted_invoice_url /
        invoice_pdf) since building our own PDF renderer for legal invoices
        would just duplicate what Stripe already generates correctly."""
        _require_stripe_configured()

        org_id = get_default_organization_id(self.db, current_user)
        if org_id is None:
            return []
        org = self.db.get(Organization, org_id)
        if org is None or not org.stripe_customer_id:
            return []

        invoices = stripe.Invoice.list(customer=org.stripe_customer_id, limit=24)

        results: list[dict] = []
        for inv in invoices.data:
            plan_name = None
            lines = inv.get("lines", {}).get("data") or []
            if lines:
                plan_name = lines[0].get("description")

            results.append(
                {
                    "id": inv["id"],
                    "number": inv.get("number"),
                    "status": inv.get("status") or "unknown",
                    "amount_paid": (inv.get("amount_paid") or 0) / 100,
                    "currency": (inv.get("currency") or "eur").upper(),
                    "created_at": datetime.fromtimestamp(inv["created"], tz=timezone.utc).isoformat(),
                    "period_start": (
                        datetime.fromtimestamp(inv["period_start"], tz=timezone.utc).isoformat()
                        if inv.get("period_start")
                        else None
                    ),
                    "period_end": (
                        datetime.fromtimestamp(inv["period_end"], tz=timezone.utc).isoformat()
                        if inv.get("period_end")
                        else None
                    ),
                    "hosted_invoice_url": inv.get("hosted_invoice_url"),
                    "invoice_pdf": inv.get("invoice_pdf"),
                    "plan_name": plan_name,
                }
            )
        return results

    def create_portal_session(self, *, current_user: User) -> str:
        """Stripe's hosted Customer Portal — lets the user manage their
        payment method, download invoices, and cancel/change plan without
        us having to build any of that UI ourselves. Requires an existing
        Stripe customer, which only exists once they've been through
        checkout at least once."""
        _require_stripe_configured()

        org_id = get_default_organization_id(self.db, current_user)
        if org_id is None:
            raise BillingError("No workspace is associated with this user.")
        org = self.db.get(Organization, org_id)
        if org is None or not org.stripe_customer_id:
            raise BillingError("No billing account yet — subscribe to a plan first.")

        session = stripe.billing_portal.Session.create(
            customer=org.stripe_customer_id,
            return_url=f"{settings.FRONTEND_URL}/profile",
        )
        return session.url

    # --- Webhook handling -------------------------------------------------

    def _grant_plan_entitlements(self, *, organization_id: int, plan_id: int) -> None:
        """Whatever `plan` includes (Plan.included_catalog_items — the same
        list shown as "what's included" on the pricing page) becomes
        accessible to every active member of the subscribing organization
        the moment the subscription goes active/trialing. This never
        creates a permanent grant by itself (source="plan_entitlement"
        leaves CatalogPurchase.permanent_access_granted_at NULL) — access is
        live-checked against the organization's current subscription status
        by CatalogPurchasesRepository.slugs_for_user(), so it disappears on
        its own once the subscription is no longer active/trialing (see
        _mark_canceled / the invoice.payment_failed branch of
        handle_webhook). Nothing needs to be deleted here on cancellation."""
        plan = self.db.get(Plan, plan_id)
        if plan is None:
            return
        item_ids = [pci.catalog_item_id for pci in plan.included_catalog_items]
        if not item_ids:
            return

        member_user_ids = self.db.execute(
            select(OrganizationMember.user_id).where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.membership_status == MembershipStatus.active,
            )
        ).scalars().all()

        purchases = CatalogPurchasesRepository(self.db)
        for user_id in member_user_ids:
            for item_id in item_ids:
                purchases.add(user_id, item_id, organization_id=organization_id, source="plan_entitlement")
        self.db.commit()

    def _upsert_subscription_from_stripe(self, stripe_sub: dict) -> None:
        metadata = stripe_sub.get("metadata") or {}
        org_id = metadata.get("organization_id")
        plan_id = metadata.get("plan_id")
        if org_id is None or plan_id is None:
            logger.warning("Stripe subscription %s has no organization_id/plan_id metadata; skipping", stripe_sub.get("id"))
            return

        sub = (
            self.db.query(Subscription)
            .filter(Subscription.provider_subscription_id == stripe_sub["id"])
            .one_or_none()
        )
        stripe_status = str(stripe_sub.get("status", "active"))
        mapped_status = _STRIPE_STATUS_MAP.get(stripe_status, SubscriptionStatus.active)

        starts_at = datetime.fromtimestamp(stripe_sub["current_period_start"], tz=timezone.utc)
        ends_at = (
            datetime.fromtimestamp(stripe_sub["cancel_at"], tz=timezone.utc)
            if stripe_sub.get("cancel_at")
            else None
        )
        trial_ends_at = (
            datetime.fromtimestamp(stripe_sub["trial_end"], tz=timezone.utc)
            if stripe_sub.get("trial_end")
            else None
        )

        if sub is None:
            sub = Subscription(
                organization_id=int(org_id),
                plan_id=int(plan_id),
                provider=SubscriptionProvider.stripe,
                provider_subscription_id=stripe_sub["id"],
                status=mapped_status,
                starts_at=starts_at,
                ends_at=ends_at,
                trial_ends_at=trial_ends_at,
            )
            self.db.add(sub)
        else:
            sub.plan_id = int(plan_id)
            sub.status = mapped_status
            sub.ends_at = ends_at
            sub.trial_ends_at = trial_ends_at

        self.db.commit()

        if mapped_status in (SubscriptionStatus.active, SubscriptionStatus.trialing):
            self._grant_plan_entitlements(organization_id=int(org_id), plan_id=int(plan_id))

    def _grant_catalog_purchase_from_session(self, session_data: dict) -> None:
        metadata = session_data.get("metadata") or {}
        item_id = metadata.get("catalog_item_id")
        user_id = metadata.get("user_id")
        if item_id is None or user_id is None:
            logger.warning(
                "Stripe checkout session %s (mode=payment) has no catalog_item_id/user_id metadata; skipping",
                session_data.get("id"),
            )
            return
        CatalogPurchasesRepository(self.db).add(
            int(user_id),
            int(item_id),
            source="stripe_checkout",
            stripe_checkout_session_id=session_data.get("id"),
        )
        self.db.commit()

    def _mark_canceled(self, stripe_subscription_id: str) -> None:
        """Only updates Subscription.status/ends_at — nothing to do to
        CatalogPurchase here. Every plan-sourced row's access is
        live-checked against this status by
        CatalogPurchasesRepository.slugs_for_user(), so it stops counting
        the moment status leaves active/trialing. Anything the user
        actually paid for directly stays theirs (permanent_access_granted_at
        is set for those rows, independent of this subscription)."""
        sub = (
            self.db.query(Subscription)
            .filter(Subscription.provider_subscription_id == stripe_subscription_id)
            .one_or_none()
        )
        if sub is None:
            return
        sub.status = SubscriptionStatus.canceled
        sub.ends_at = datetime.now(timezone.utc)
        self.db.commit()

    async def handle_webhook(self, request: Request) -> None:
        _require_stripe_configured()
        if not settings.STRIPE_WEBHOOK_SECRET:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe webhook secret is not configured on this server.",
            )

        payload = await request.body()
        sig_header = request.headers.get("stripe-signature", "")
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError) as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook payload") from exc

        event_type = event["type"]
        data = event["data"]["object"]

        if event_type == "checkout.session.completed":
            if data.get("mode") == "payment":
                self._grant_catalog_purchase_from_session(data)
            else:
                subscription_id = data.get("subscription")
                if subscription_id:
                    stripe_sub = stripe.Subscription.retrieve(subscription_id)
                    self._upsert_subscription_from_stripe(stripe_sub)
        elif event_type in ("customer.subscription.updated", "customer.subscription.created"):
            self._upsert_subscription_from_stripe(data)
        elif event_type == "customer.subscription.deleted":
            self._mark_canceled(data["id"])
        elif event_type == "invoice.payment_failed":
            subscription_id = data.get("subscription")
            if subscription_id:
                sub = (
                    self.db.query(Subscription)
                    .filter(Subscription.provider_subscription_id == subscription_id)
                    .one_or_none()
                )
                if sub is not None:
                    sub.status = SubscriptionStatus.past_due
                    self.db.commit()
        else:
            logger.info("Unhandled Stripe webhook event type: %s", event_type)
