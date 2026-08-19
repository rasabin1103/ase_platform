from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal

from app.models.pricing_dimension_level import PricingDimensionLevel

_CENTS = Decimal("0.01")


def calculate_recommended_price(
    *,
    base_price: Decimal,
    dimension_multipliers: list[Decimal] | None = None,
) -> Decimal:
    """The one formula behind the whole pricing engine — multiplicative by
    design (chosen over an additive points system so a non-technical admin
    can read it as 'this costs 30% more for being high complexity' rather
    than reasoning about an abstract points-to-currency conversion rate).

    recommended_price = base_price(pillar) × Π(every selected dimension's multiplier)

    Every "subelemento" a pillar has — subtipo, complejidad, funcionalidad,
    mantenimiento, duración, especialización, páginas, horas... — is just a
    PricingDimensionType. There is no separate "subcategory" concept: each
    one the admin/item has a level selected for contributes its multiplier
    to the same product. Missing selections simply don't participate — a
    dimension no one has picked yet behaves as ×1, it never blocks the
    recommendation. The only thing that differs structurally between
    pillars is which dimension types exist and the base price itself (for
    the service pillar, base_price plays the role of the hourly rate).
    """
    raw = base_price
    for multiplier in dimension_multipliers or []:
        raw *= multiplier
    return raw.quantize(_CENTS, rounding=ROUND_HALF_UP)


def match_dimension_level_for_quantity(
    levels: list[PricingDimensionLevel], quantity: int
) -> PricingDimensionLevel | None:
    """Range-based dimension types only (book "Páginas", service "Horas") —
    finds the first active level whose [min_value, max_value] range (both
    inclusive; max_value=None means unbounded) contains `quantity`. Levels
    should be pre-filtered to the dimension type and ideally pre-sorted by
    min_value by the caller; this just returns the first match, so
    overlapping ranges resolve to whichever is listed first (an admin
    config error, not something to silently "fix" here)."""
    for level in levels:
        if not level.is_active:
            continue
        lo = level.min_value if level.min_value is not None else 0
        hi = level.max_value
        if quantity >= lo and (hi is None or quantity <= hi):
            return level
    return None
