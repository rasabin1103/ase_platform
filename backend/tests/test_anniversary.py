"""Unit tests for the pure tenure math in app/core/anniversary.py — no DB
needed. The notification side effect in run_anniversary_sweep is exercised
only indirectly elsewhere; this file only covers the deterministic helpers
`_months_since` and `_tenure_label`."""
from __future__ import annotations

from datetime import datetime, timezone

import pytest

from app.core.anniversary import _months_since, _tenure_label


class TestMonthsSince:
    def test_zero_months_on_signup_day(self):
        created = datetime(2024, 3, 10, tzinfo=timezone.utc)
        now = datetime(2024, 3, 10, tzinfo=timezone.utc)
        assert _months_since(created, now=now) == 0

    def test_six_months_exactly(self):
        created = datetime(2024, 1, 1, tzinfo=timezone.utc)
        now = datetime(2024, 7, 1, tzinfo=timezone.utc)
        assert _months_since(created, now=now) == 6

    def test_never_negative(self):
        created = datetime(2024, 6, 1, tzinfo=timezone.utc)
        now = datetime(2024, 1, 1, tzinfo=timezone.utc)
        assert _months_since(created, now=now) == 0


class TestTenureLabel:
    @pytest.mark.parametrize(
        "months,expected",
        [
            (6, "6 meses"),
            (11, "11 meses"),
            (12, "1 año"),
            (13, "1 año y 1 mes"),
            (18, "1 año y 6 meses"),
            (24, "2 años"),
            (30, "2 años y 6 meses"),
        ],
    )
    def test_labels(self, months, expected):
        assert _tenure_label(months) == expected
