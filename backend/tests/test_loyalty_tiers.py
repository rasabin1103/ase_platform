"""Unit tests for the pure tenure/tier math in app/core/loyalty.py — no DB
needed. The Stripe/notification side effects in run_loyalty_sweep are
exercised only indirectly elsewhere; this file only covers the
deterministic helpers `_months_since` and `_tier_for_months`."""
from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.core.loyalty import _months_since, _tier_for_months
from app.models.enums import LoyaltyTier


class TestMonthsSince:
    def test_zero_months_on_same_day(self):
        start = datetime(2024, 1, 15, tzinfo=timezone.utc)
        now = datetime(2024, 1, 15, tzinfo=timezone.utc)
        assert _months_since(start, now=now) == 0

    def test_full_calendar_months_elapsed(self):
        start = datetime(2024, 1, 15, tzinfo=timezone.utc)
        now = datetime(2024, 7, 15, tzinfo=timezone.utc)
        assert _months_since(start, now=now) == 6

    def test_not_yet_reached_the_day_of_month_rounds_down(self):
        start = datetime(2024, 1, 20, tzinfo=timezone.utc)
        now = datetime(2024, 7, 15, tzinfo=timezone.utc)
        # 6 calendar months, but day 15 < day 20 -> hasn't fully completed month 6 yet
        assert _months_since(start, now=now) == 5

    def test_spans_year_boundary(self):
        start = datetime(2023, 11, 1, tzinfo=timezone.utc)
        now = datetime(2024, 2, 1, tzinfo=timezone.utc)
        assert _months_since(start, now=now) == 3

    def test_never_negative_for_a_future_start_date(self):
        start = datetime(2025, 1, 1, tzinfo=timezone.utc)
        now = datetime(2024, 1, 1, tzinfo=timezone.utc)
        assert _months_since(start, now=now) == 0


class TestTierForMonths:
    @pytest.mark.parametrize(
        "months,expected",
        [
            (0, None),
            (5, None),
            (6, LoyaltyTier.silver),
            (11, LoyaltyTier.silver),
            (12, LoyaltyTier.gold),
            (23, LoyaltyTier.gold),
            (24, LoyaltyTier.platinum),
            (35, LoyaltyTier.platinum),
            (36, LoyaltyTier.infinite),
            (100, LoyaltyTier.infinite),
        ],
    )
    def test_thresholds(self, months, expected):
        assert _tier_for_months(months) == expected

    def test_lands_on_highest_qualifying_tier_in_one_step(self):
        # A user who raced past several thresholds since the last sweep
        # (e.g. server was down for a year) should land on the top tier
        # directly, not climb one tier per run.
        assert _tier_for_months(48) == LoyaltyTier.infinite
