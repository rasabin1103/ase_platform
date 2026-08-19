"""Unit tests for app/core/pricing_engine.py — pure functions, no DB
needed. Covers the unified formula (base_price × every selected dimension
multiplier, no separate subcategory concept) and the range-based level
matcher shared by book "Páginas" and service "Horas"."""
from __future__ import annotations

from decimal import Decimal

import pytest

from app.core.pricing_engine import (
    calculate_recommended_price,
    match_dimension_level_for_quantity,
)
from app.models.pricing_dimension_level import PricingDimensionLevel


def _level(*, label: str, multiplier: str, min_value: int | None = None, max_value: int | None = None, is_active: bool = True) -> PricingDimensionLevel:
    return PricingDimensionLevel(
        label=label,
        multiplier=Decimal(multiplier),
        min_value=min_value,
        max_value=max_value,
        is_active=is_active,
    )


class TestCalculateRecommendedPrice:
    def test_base_price_alone_with_no_dimensions(self):
        result = calculate_recommended_price(base_price=Decimal("100.00"), dimension_multipliers=[])
        assert result == Decimal("100.00")

    def test_none_dimension_multipliers_behaves_like_empty_list(self):
        result = calculate_recommended_price(base_price=Decimal("100.00"), dimension_multipliers=None)
        assert result == Decimal("100.00")

    def test_single_multiplier(self):
        result = calculate_recommended_price(base_price=Decimal("100.00"), dimension_multipliers=[Decimal("1.30")])
        assert result == Decimal("130.00")

    def test_multiple_multipliers_compound(self):
        # product = base × subtipo × complejidad × funcionalidad × mantenimiento
        result = calculate_recommended_price(
            base_price=Decimal("200.00"),
            dimension_multipliers=[Decimal("1.10"), Decimal("1.20"), Decimal("1.05"), Decimal("0.95")],
        )
        # 200 * 1.10 * 1.20 * 1.05 * 0.95 = 263.34
        assert result == Decimal("263.34")

    def test_rounds_half_up_to_cents(self):
        result = calculate_recommended_price(base_price=Decimal("10.005"), dimension_multipliers=[])
        assert result == Decimal("10.01")

    def test_zero_base_price_stays_zero_regardless_of_multipliers(self):
        result = calculate_recommended_price(base_price=Decimal("0.00"), dimension_multipliers=[Decimal("5.0")])
        assert result == Decimal("0.00")

    def test_multiplier_below_one_discounts(self):
        result = calculate_recommended_price(base_price=Decimal("100.00"), dimension_multipliers=[Decimal("0.50")])
        assert result == Decimal("50.00")

    def test_service_style_hours_times_hourly_rate_times_complexity(self):
        # service = horas × tarifa/hora(=base) × complejidad × especialización
        result = calculate_recommended_price(
            base_price=Decimal("40.00"),  # hourly rate
            dimension_multipliers=[Decimal("8"), Decimal("1.25"), Decimal("1.10")],  # 8h, complexity, specialization
        )
        # 40 * 8 * 1.25 * 1.10 = 440.00
        assert result == Decimal("440.00")


class TestMatchDimensionLevelForQuantity:
    def test_matches_bounded_range(self):
        levels = [
            _level(label="1-100", multiplier="1.0", min_value=1, max_value=100),
            _level(label="101-300", multiplier="1.2", min_value=101, max_value=300),
        ]
        matched = match_dimension_level_for_quantity(levels, 50)
        assert matched is not None
        assert matched.label == "1-100"

    def test_matches_unbounded_upper_range(self):
        levels = [
            _level(label="1-100", multiplier="1.0", min_value=1, max_value=100),
            _level(label="301+", multiplier="1.5", min_value=301, max_value=None),
        ]
        matched = match_dimension_level_for_quantity(levels, 5000)
        assert matched is not None
        assert matched.label == "301+"

    def test_min_value_none_treated_as_zero(self):
        levels = [_level(label="0-50", multiplier="1.0", min_value=None, max_value=50)]
        matched = match_dimension_level_for_quantity(levels, 0)
        assert matched is not None
        assert matched.label == "0-50"

    def test_returns_none_when_nothing_matches(self):
        levels = [_level(label="1-10", multiplier="1.0", min_value=1, max_value=10)]
        matched = match_dimension_level_for_quantity(levels, 999)
        assert matched is None

    def test_returns_none_for_empty_levels(self):
        assert match_dimension_level_for_quantity([], 10) is None

    def test_skips_inactive_levels(self):
        levels = [
            _level(label="inactive-match", multiplier="9.0", min_value=1, max_value=100, is_active=False),
            _level(label="active-match", multiplier="1.0", min_value=1, max_value=100, is_active=True),
        ]
        matched = match_dimension_level_for_quantity(levels, 10)
        assert matched is not None
        assert matched.label == "active-match"

    def test_first_match_wins_on_overlapping_ranges(self):
        levels = [
            _level(label="first", multiplier="1.0", min_value=1, max_value=100),
            _level(label="second-overlapping", multiplier="2.0", min_value=50, max_value=150),
        ]
        matched = match_dimension_level_for_quantity(levels, 75)
        assert matched is not None
        assert matched.label == "first"

    @pytest.mark.parametrize("quantity", [1, 300, 301])
    def test_boundary_values_are_inclusive(self, quantity):
        levels = [_level(label="1-300", multiplier="1.0", min_value=1, max_value=300)]
        matched = match_dimension_level_for_quantity(levels, quantity)
        if quantity <= 300:
            assert matched is not None
        else:
            assert matched is None
