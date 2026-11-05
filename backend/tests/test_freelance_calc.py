"""Paridad de cálculos de la gestión de autónomo (sin base de datos)."""

import datetime as dt
from types import SimpleNamespace as NS

import pytest

from app.modules.freelance import calc, reports


def test_cents_round_half_up():
    assert calc.cents("10.005") == 1001
    assert calc.pct_of(10000, 21) == 2100


def test_invoice_total_is_base_plus_vat_minus_irpf():
    base = calc.invoice_lines([{"description": "x", "unit": "días", "quantity": "2", "rate": "100.00"}])[1]
    t = calc.invoice_totals(base, 21, 15)
    assert (t["vatCents"], t["irpfCents"], t["totalCents"]) == (4200, 3000, 21200)


def test_due_date_next_month_wins_over_explicit():
    inv = dt.date(2026, 1, 15)
    assert calc.due_date("nextMonth", 60, inv, dt.date(2026, 3, 1)) == dt.date(2026, 2, 28)
    assert calc.due_date("days", 30, inv, None) == dt.date(2026, 2, 14)


def test_recurrence_keeps_day_of_month():
    assert calc.next_occurrence(dt.date(2026, 1, 31), 31) == dt.date(2026, 2, 28)
    assert calc.next_occurrence(dt.date(2026, 2, 28), 31) == dt.date(2026, 3, 31)


def test_economic_cost_includes_non_deductible_vat():
    assert calc.economic_cost(12100, 2100, 50) == 12100 - 1050


def test_wealth_projection_compound():
    plan = {"initialCents": 100000, "monthlyCents": 0, "annualRate": 12, "horizon": 12, "startMonth": "2026-01"}
    assert calc.wealth_projection(plan)[-1]["value"] == 112000


def test_ledger_rejects_overdraw():
    plan = {"initialCents": 1000, "startMonth": "2026-01", "category": "saving"}
    entries = [{"id": 1, "action": "withdrawal", "date": dt.date(2026, 2, 1), "amountCents": 2000}]
    with pytest.raises(ValueError):
        calc.validate_ledger(plan, entries)


def test_cash_available_and_reserve():
    client = NS(id=1, extra_irpf=10)
    inv = NS(client_id=1, base_cents=10000, vat_cents=2100, total_cents=10600, paid=True,
             paid_date=dt.date(2026, 1, 5), date=dt.date(2026, 1, 1), client_snapshot={})
    cash = reports.cash_data(dt.date(2026, 2, 1), [inv], [], None, {1: client}, 0)
    assert cash["receipts"] == 10600 and cash["vat"] == 2100 and cash["reserve"] == 1000
    assert cash["available"] == 10600 - 2100 - 1000


def test_goal_alternative_rates():
    r = reports.goal_calculation(1700, 300, 10, 80, 0.15)
    assert round(r["base"], 2) == 2352.94 and round(r["day"], 2) == 235.29
