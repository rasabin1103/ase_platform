from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone

import stripe
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.audit import record_audit_log
from app.core.config import settings
from app.models.enums import LoyaltyTier, MembershipStatus, SubscriptionStatus, UserStatus
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.subscription import Subscription
from app.models.user import User
from app.modules.notifications.service import NotificationsService

logger = logging.getLogger(__name__)

# (minimum consecutive months as an active/trialing subscriber, tier) —
# checked highest first so a user who has raced past several thresholds
# since the last sweep run lands on the correct tier in one step rather
# than climbing one tier per sweep.
_TIER_THRESHOLDS: list[tuple[int, LoyaltyTier]] = [
    (36, LoyaltyTier.infinite),
    (24, LoyaltyTier.platinum),
    (12, LoyaltyTier.gold),
    (6, LoyaltyTier.silver),
]

_TIER_RANK: dict[LoyaltyTier, int] = {
    LoyaltyTier.silver: 1,
    LoyaltyTier.gold: 2,
    LoyaltyTier.platinum: 3,
    LoyaltyTier.infinite: 4,
}

# Percent-off, one-time discount code awarded the moment a user first
# reaches each tier. Per Roberto's explicit choice, the reward is a visual
# badge (frontend) plus this Stripe discount coupon — never a free catalog
# item grant.
_TIER_DISCOUNT_PERCENT: dict[LoyaltyTier, int] = {
    LoyaltyTier.silver: 5,
    LoyaltyTier.gold: 10,
    LoyaltyTier.platinum: 15,
    LoyaltyTier.infinite: 20,
}

_TIER_LABEL_ES: dict[LoyaltyTier, str] = {
    LoyaltyTier.silver: "Plata",
    LoyaltyTier.gold: "Oro",
    LoyaltyTier.platinum: "Platino",
    LoyaltyTier.infinite: "Infinita",
}


def _months_since(start: datetime, *, now: datetime) -> int:
    months = (now.year - start.year) * 12 + (now.month - start.month)
    if now.day < start.day:
        months -= 1
    return max(months, 0)


def _tier_for_months(months: int) -> LoyaltyTier | None:
    for threshold, tier in _TIER_THRESHOLDS:
        if months >= threshold:
            return tier
    return None


def _subscriber_since_by_user(db: Session) -> dict[int, datetime]:
    """Earliest start date, per user, among their currently active/trialing
    subscriptions across every organization they belong to. A user with no
    active subscription anywhere simply doesn't appear in the result — no
    tenure, no tier. This is deliberately based on subscription tenure, not
    `User.created_at` (that's what drives the separate account-anniversary
    notification in app/core/anniversary.py)."""
    rows = db.execute(
        select(OrganizationMember.user_id, func.min(Subscription.starts_at))
        .join(Subscription, Subscription.organization_id == OrganizationMember.organization_id)
        .where(
            OrganizationMember.membership_status == MembershipStatus.active,
            Subscription.status.in_([SubscriptionStatus.active, SubscriptionStatus.trialing]),
        )
        .group_by(OrganizationMember.user_id)
    ).all()
    return {user_id: started_at for user_id, started_at in rows}


def _issue_discount_code(db: Session, *, user: User, tier: LoyaltyTier) -> str | None:
    """Best-effort: creates a single-use Stripe promotion code worth
    _TIER_DISCOUNT_PERCENT[tier]% off, restricted to the user's Stripe
    customer when they already have one. Returns the redeemable code, or
    None if Stripe isn't configured or the coupon couldn't be created —
    never blocks the tier upgrade itself, since the badge is awarded
    either way."""
    if not settings.STRIPE_SECRET_KEY:
        return None
    stripe.api_key = settings.STRIPE_SECRET_KEY

    org = db.execute(
        select(Organization)
        .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
        .where(
            OrganizationMember.user_id == user.id,
            OrganizationMember.membership_status == MembershipStatus.active,
            Organization.stripe_customer_id.isnot(None),
        )
        .limit(1)
    ).scalars().first()

    try:
        coupon = stripe.Coupon.create(
            percent_off=_TIER_DISCOUNT_PERCENT[tier],
            duration="once",
            name=f"ASE Fidelidad {_TIER_LABEL_ES[tier]}",
        )
        code = f"ASE{tier.value.upper()}{secrets.token_hex(3).upper()}"
        promo_kwargs: dict = {"coupon": coupon.id, "code": code, "max_redemptions": 1}
        if org is not None and org.stripe_customer_id:
            promo_kwargs["customer"] = org.stripe_customer_id
        stripe.PromotionCode.create(**promo_kwargs)
        return code
    except Exception:
        logger.exception("Failed to create loyalty discount coupon for user %s (tier=%s)", user.id, tier.value)
        return None


def run_loyalty_sweep(db: Session) -> int:
    """Promotes every active user to the highest loyalty tier their
    subscriber tenure now qualifies for (Silver/Gold/Platinum/Infinite at
    6/12/24/36 months — see LoyaltyTier), notifying and issuing a one-time
    Stripe discount code on every upgrade. Idempotent via
    `User.loyalty_tier`, which doubles as both "current tier" and the
    dedup guard: only an actual rank increase triggers a
    notification/coupon, tiers are never downgraded by this sweep, and
    re-running it is always safe."""
    tenure_by_user = _subscriber_since_by_user(db)
    if not tenure_by_user:
        return 0

    now = datetime.now(timezone.utc)
    users = db.execute(
        select(User).where(User.status == UserStatus.active, User.id.in_(tenure_by_user.keys()))
    ).scalars().all()

    notifications = NotificationsService(db)
    count = 0
    for user in users:
        months = _months_since(tenure_by_user[user.id], now=now)
        new_tier = _tier_for_months(months)
        if new_tier is None:
            continue
        current_rank = _TIER_RANK.get(user.loyalty_tier, 0)
        if _TIER_RANK[new_tier] <= current_rank:
            continue
        try:
            code = _issue_discount_code(db, user=user, tier=new_tier)
            body = (
                f"Has alcanzado el nivel de fidelidad {_TIER_LABEL_ES[new_tier]}. "
                "¡Gracias por seguir confiando en nosotros!"
            )
            if code:
                body += (
                    f" Como agradecimiento, aquí tienes un código de descuento del "
                    f"{_TIER_DISCOUNT_PERCENT[new_tier]}% para tu próxima compra: {code}."
                )
            notifications.notify_user(
                user_id=user.id,
                type="loyalty_tier_up",
                title=f"¡Nuevo nivel de fidelidad: {_TIER_LABEL_ES[new_tier]}!",
                body=body,
            )
            user.loyalty_tier = new_tier
            db.commit()
            record_audit_log(
                db,
                actor_user_id=None,
                action="loyalty.tier_upgraded",
                entity_type="user",
                entity_id=str(user.id),
                metadata={"tier": new_tier.value, "months": months, "discount_code": code},
            )
            count += 1
        except Exception:
            db.rollback()
            logger.exception("Failed to process loyalty upgrade for user %s", user.id)
    return count
