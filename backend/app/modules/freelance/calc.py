"""Cálculos de dominio de la gestión de autónomo (puros, sin base de datos).

Portados de «Cuenta Clara» conservando sus reglas: importes en céntimos
enteros con `Decimal` y redondeo ROUND_HALF_UP (nunca `float`)."""

from __future__ import annotations

import calendar
import datetime as dt
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Iterable

MAX_AMOUNT = Decimal("100000000")
ONE = Decimal("1")


def cents(value: Any) -> int:
    """Euros (decimal o cadena) → céntimos, redondeo comercial."""
    return int((Decimal(str(value)) * 100).quantize(ONE, rounding=ROUND_HALF_UP))


def pct_of(amount_cents: int, percent: Any) -> int:
    """`amount × percent / 100` redondeado al céntimo."""
    return int((Decimal(amount_cents) * Decimal(str(percent)) / 100).quantize(ONE, rounding=ROUND_HALF_UP))


def euros(amount_cents: int) -> str:
    return str(Decimal(amount_cents) / 100)


# --- fechas ------------------------------------------------------------------


def last_day_next_month(date: dt.date) -> dt.date:
    year, month = (date.year + 1, 1) if date.month == 12 else (date.year, date.month + 1)
    return dt.date(year, month, calendar.monthrange(year, month)[1])


def next_occurrence(date: dt.date, day: int) -> dt.date:
    """Mismo día del mes siguiente (el 31 pasa al último día de febrero y vuelve al 31)."""
    year, month = (date.year + 1, 1) if date.month == 12 else (date.year, date.month + 1)
    return dt.date(year, month, min(day, calendar.monthrange(year, month)[1]))


def due_date(rule: str, payment_days: int, invoice_date: dt.date, explicit: dt.date | None) -> dt.date | None:
    """Vencimiento. `nextMonth` = último día del mes siguiente a la EMISIÓN (no al mes de
    servicio) y manda sobre cualquier fecha enviada. `days` = emisión + plazo, salvo que se indique otra."""
    if rule == "nextMonth":
        return last_day_next_month(invoice_date)
    return explicit or invoice_date + dt.timedelta(days=payment_days)


# --- facturas y gastos -------------------------------------------------------


def invoice_lines(lines: Iterable[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    clean = []
    for line in lines:
        quantity, rate = Decimal(str(line["quantity"])), Decimal(str(line["rate"]))
        clean.append(
            {
                "description": str(line.get("description", "")).strip(),
                "unit": line["unit"],
                "quantity": str(quantity),
                "rate": str(rate),
                "baseCents": cents(quantity * rate),
            }
        )
    return clean, sum(line["baseCents"] for line in clean)


def invoice_totals(base_cents: int, vat: Any, irpf: Any) -> dict[str, int]:
    """total a cobrar = base + IVA − IRPF."""
    vat_c, irpf_c = pct_of(base_cents, vat), pct_of(base_cents, irpf)
    return {"baseCents": base_cents, "vatCents": vat_c, "irpfCents": irpf_c, "totalCents": base_cents + vat_c - irpf_c}


def expense_totals(base: Any, vat: Any) -> dict[str, int]:
    base_c = cents(base)
    vat_c = pct_of(base_c, vat)
    return {"baseCents": base_c, "vatCents": vat_c, "totalCents": base_c + vat_c}


def deductible_vat(vat_cents: int, vat_deductible: Any) -> int:
    """IVA soportado deducible."""
    return pct_of(vat_cents, vat_deductible)


def economic_cost(total_cents: int, vat_cents: int, vat_deductible: Any) -> int:
    """Coste económico = base + IVA no deducible."""
    return total_cents - deductible_vat(vat_cents, vat_deductible)


def extra_reserve(base_cents: int, extra_irpf: Any) -> int:
    """Reserva personal extra de IRPF: no modifica el total de la factura."""
    return pct_of(base_cents, extra_irpf)


# --- patrimonio (ahorro e inversión) -----------------------------------------


def monthly_rate(annual_rate_pct: Any) -> Decimal:
    """(1 + anual)^(1/12) − 1. Nunca anual/12. Se calcula en coma flotante y se fija a 14
    cifras significativas, igual que la aplicación original (`toPrecision(14)`), para que las
    proyecciones coincidan al céntimo."""
    annual = float(Decimal(str(annual_rate_pct))) / 100
    if annual <= -1:
        return Decimal(-1)
    return Decimal(f"{(1 + annual) ** (1 / 12) - 1:.14g}")


def add_months(month: str, n: int) -> str:
    year, m = int(month[:4]), int(month[5:7])
    index = year * 12 + (m - 1) + n
    return f"{index // 12:04d}-{index % 12 + 1:02d}"


def wealth_projection(plan: dict[str, Any]) -> list[dict[str, Any]]:
    """Proyección matemática: rendimiento del mes sobre el saldo anterior y aportación a FINAL de mes."""
    rate = monthly_rate(plan["annualRate"])
    value = capital = int(plan["initialCents"])
    rows = []
    for i in range(int(plan["horizon"])):
        gain = int((Decimal(value) * rate).quantize(ONE, rounding=ROUND_HALF_UP))
        value += gain + int(plan["monthlyCents"])
        capital += int(plan["monthlyCents"])
        rows.append({"key": add_months(plan["startMonth"], i), "value": value, "capital": capital, "gain": value - capital})
    return rows


def wealth_actual(plan: dict[str, Any], entries: Iterable[dict[str, Any]], until: dt.date) -> dict[str, int]:
    """Saldo real: solo movimientos y valoraciones registrados."""
    if until.isoformat()[:7] < plan["startMonth"]:
        return {"balance": 0, "contributed": 0, "withdrawn": 0, "gain": 0}
    balance = contributed = int(plan["initialCents"])
    withdrawn = 0
    for e in sorted((e for e in entries if e["date"] <= until), key=lambda e: (e["date"], e["id"])):
        if e["action"] == "contribution":
            balance += e["amountCents"]
            contributed += e["amountCents"]
        elif e["action"] == "withdrawal":
            balance -= e["amountCents"]
            withdrawn += e["amountCents"]
        else:
            balance = e["amountCents"]
    return {"balance": balance, "contributed": contributed, "withdrawn": withdrawn, "gain": balance - contributed + withdrawn}


def validate_ledger(plan: dict[str, Any], entries: Iterable[dict[str, Any]]) -> None:
    """Orden fecha→id; sin retiradas por encima del saldo; valoraciones solo en inversión."""
    balance = int(plan["initialCents"])
    for e in sorted(entries, key=lambda e: (e["date"], e["id"])):
        if e["date"].isoformat()[:7] < plan["startMonth"]:
            raise ValueError("El movimiento es anterior al inicio del plan")
        if e["action"] == "valuation":
            if plan["category"] != "investment":
                raise ValueError("Las valoraciones solo se registran en inversiones")
            balance = e["amountCents"]
        elif e["action"] == "contribution":
            balance += e["amountCents"]
        else:
            balance -= e["amountCents"]
            if balance < 0:
                raise ValueError("La retirada supera el saldo registrado del plan en esa fecha")


def wealth_cash_transfers(entries: Iterable[dict[str, Any]], until: dt.date) -> int:
    """Aportaciones desde caja menos retiradas que vuelven a caja (las valoraciones no mueven caja)."""
    return sum(
        e["amountCents"] if e["action"] == "contribution" else -e["amountCents"]
        for e in entries
        if e["fromBusiness"] and e["date"] <= until and e["action"] != "valuation"
    )
