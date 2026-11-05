"""Informes y resúmenes del autónomo, calculados SIEMPRE en el servidor.

En la aplicación original los resúmenes vivían en el navegador (con `Number`);
aquí usan los mismos cálculos en céntimos que las facturas y los gastos, de modo
que cualquier pantalla de ASE ve las mismas cifras. Todas las funciones reciben
filas ya filtradas por usuario y la fecha «de hoy» (zona Europe/Madrid)."""

from __future__ import annotations

import calendar
import datetime as dt
import unicodedata
from typing import Any, Iterable, Sequence

from app.modules.freelance import calc


def _fold(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text.lower()) if unicodedata.category(c) != "Mn")


def matches_concept(invoice: Any, concept: str) -> bool:
    """Búsqueda sin tildes ni mayúsculas en la descripción y en las líneas."""
    needle = _fold(concept.strip())
    if not needle:
        return True
    haystack = " ".join([invoice.description, *[line.get("description", "") for line in invoice.lines]])
    return needle in _fold(haystack)


def expense_matches(expense: Any, concept: str) -> bool:
    needle = _fold(concept.strip())
    return not needle or needle in _fold(expense.description)


def reserve_for(invoice: Any, clients: dict[int, Any]) -> int:
    """Reserva extra de IRPF con el % ACTUAL del cliente (si no existe, el de la copia de la factura)."""
    client = clients.get(invoice.client_id)
    pct = client.extra_irpf if client is not None else invoice.client_snapshot.get("extraIrpf", 0)
    return calc.extra_reserve(invoice.base_cents, pct)


def _net_cost(expense: Any) -> int:
    return calc.economic_cost(expense.total_cents, expense.vat_cents, expense.vat_deductible)


def _paid_on(row: Any, today: dt.date) -> bool:
    return bool(row.paid) and (row.paid_date or row.date) <= today


# --- caja y previsión --------------------------------------------------------


def cash_data(
    today: dt.date, invoices: Sequence[Any], expenses: Sequence[Any], settings: Any | None,
    clients: dict[int, Any], wealth_transfers: int,
) -> dict[str, int]:
    """Disponible = saldo inicial + cobros − pagos − retiradas − IVA/IRPF ya pagados
    − IVA apartado − reserva extra apartada − transferencias a patrimonio."""
    paid = [r for r in invoices if _paid_on(r, today)]
    spent = [r for r in expenses if _paid_on(r, today)]
    receipts = sum(r.total_cents for r in paid)
    cost = sum(r.total_cents for r in spent)
    opening = calc.cents(settings.opening_balance) if settings else 0
    withdrawals = calc.cents(settings.withdrawals) if settings else 0
    vat_paid = calc.cents(settings.vat_paid) if settings else 0
    extra_used = calc.cents(settings.extra_irpf_used) if settings else 0
    vat = max(0, sum(r.vat_cents for r in paid) - sum(calc.deductible_vat(r.vat_cents, r.vat_deductible) for r in spent) - vat_paid)
    reserve = max(0, sum(reserve_for(r, clients) for r in paid) - extra_used)
    available = opening + receipts - cost - withdrawals - vat_paid - extra_used - vat - reserve - wealth_transfers
    return {
        "receipts": receipts, "cost": cost, "vat": vat, "reserve": reserve,
        "allocated": wealth_transfers, "available": available,
    }


def future_recurring(rules: Iterable[Any], today: dt.date, until: dt.date) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for rule in rules:
        if not rule.active:
            continue
        key = rule.next_date
        for _ in range(120):
            if key > until:
                break
            if key > today:
                out.append({**rule.template, "date": key.isoformat()})
            key = calc.next_occurrence(key, rule.day)
    return out


def forecast_data(
    today: dt.date, invoices: Sequence[Any], expenses: Sequence[Any], rules: Sequence[Any],
    planned_allocation: Any,
) -> list[dict[str, int]]:
    """Horizontes acumulados 30/60/90 (no sumables). Las recurrencias futuras se calculan sin crearlas."""
    rows = []
    for days in (30, 60, 90):
        until = today + dt.timedelta(days=days)
        income = sum(r.total_cents for r in invoices if not r.paid and r.due and today <= r.due <= until)
        pending = sum(r.total_cents for r in expenses if not r.paid and today <= r.date <= until)
        recurring = future_recurring(rules, today, until)
        rows.append({
            "days": days, "income": income,
            "expenses": pending + sum(int(r.get("totalCents", 0)) for r in recurring),
            "recurring": len(recurring), "allocation": planned_allocation(until),
        })
    return rows


def payment_notices(today: dt.date, invoices: Sequence[Any]) -> dict[str, Any]:
    pending = [r for r in invoices if not r.paid]
    soon = today + dt.timedelta(days=7)
    late = [r for r in pending if r.due and r.due < today]
    upcoming = [r for r in pending if r.due and today <= r.due <= soon]
    pack = lambda rows: [  # noqa: E731
        {"id": r.id, "number": r.number, "client": r.client_snapshot.get("name", ""), "totalCents": r.total_cents,
         "due": r.due.isoformat() if r.due else None}
        for r in rows
    ]
    return {
        "late": pack(late), "lateTotalCents": sum(r.total_cents for r in late),
        "upcoming": pack(upcoming), "upcomingTotalCents": sum(r.total_cents for r in upcoming),
    }


# --- calendario y panel mensual ----------------------------------------------


def calendar_stats(key: str, timesheet: Any | None) -> dict[str, int]:
    year, month = int(key[:4]), int(key[5:7])
    vacations = set(timesheet.vacations) if timesheet else set()
    holidays = set(timesheet.holidays) if timesheet else set()
    weekdays = vac = hol = 0
    for day in range(1, calendar.monthrange(year, month)[1] + 1):
        if dt.date(year, month, day).weekday() >= 5:
            continue
        weekdays += 1
        iso = f"{key}-{day:02d}"
        if iso in holidays:
            hol += 1
        elif iso in vacations:
            vac += 1
    return {"weekdays": weekdays, "vacations": vac, "holidays": hol, "available": weekdays - vac - hol}


def _quantities(invoices: Iterable[Any]) -> tuple[float, float]:
    days = hours = 0.0
    for r in invoices:
        for line in r.lines:
            if line["unit"] == "días":
                days += float(line["quantity"])
            else:
                hours += float(line["quantity"])
    return days, hours


def monthly_dashboard(
    year: int, months: Iterable[int], invoices: Sequence[Any], expenses: Sequence[Any],
    clients: dict[int, Any], timesheets: dict[str, Any], concept: str = "", apply_concept: bool = True,
) -> list[dict[str, Any]]:
    """Una fila por mes. Importes por fecha de EMISIÓN; días/horas por mes de SERVICIO."""
    ok = (lambda r: matches_concept(r, concept)) if apply_concept else (lambda r: True)
    ok_e = (lambda r: expense_matches(r, concept)) if apply_concept else (lambda r: True)
    rows = []
    for m in months:
        key = f"{year}-{m:02d}"
        inv = [r for r in invoices if r.date.isoformat()[:7] == key and ok(r)]
        exp = [r for r in expenses if r.date.isoformat()[:7] == key and ok_e(r)]
        work = [r for r in invoices if (r.service_month or r.date.isoformat()[:7]) == key and ok(r)]
        days, hours = _quantities(work)
        vat_in = sum(calc.deductible_vat(r.vat_cents, r.vat_deductible) for r in exp)
        reserve = sum(reserve_for(r, clients) for r in inv)
        net_expenses = sum(_net_cost(r) for r in exp)
        income = sum(r.base_cents for r in inv)
        vat = sum(r.vat_cents for r in inv)
        irpf = sum(r.irpf_cents for r in inv)
        rows.append({
            "m": m, "key": key, "reserve": reserve, "netExpenses": net_expenses,
            "net": income - irpf - reserve - net_expenses, "income": income,
            "expenses": sum(r.base_cents for r in exp), "vat": vat, "vatIn": vat_in, "vatNet": vat - vat_in,
            "irpf": irpf, "days": days, "hours": hours, **calendar_stats(key, timesheets.get(key)),
        })
    return rows


def profitability(
    invoices: Sequence[Any], expenses: Sequence[Any], clients: dict[int, Any],
) -> list[dict[str, Any]]:
    """Gastos repartidos entre clientes en proporción a su base facturada (no imputación directa)."""
    base = sum(r.base_cents for r in invoices)
    cost = sum(_net_cost(r) for r in expenses)
    groups: dict[int, dict[str, Any]] = {}
    for r in invoices:
        g = groups.setdefault(r.client_id, {"name": r.client_snapshot.get("name", ""), "invoices": [], "dayAmount": 0, "days": 0.0, "hourAmount": 0, "hours": 0.0})
        g["invoices"].append(r)
        for line in r.lines:
            if line["unit"] == "días":
                g["days"] += float(line["quantity"])
                g["dayAmount"] += line["baseCents"]
            else:
                g["hours"] += float(line["quantity"])
                g["hourAmount"] += line["baseCents"]
    remaining = cost
    rows = []
    items = list(groups.items())
    for i, (client_id, g) in enumerate(items):
        b = sum(r.base_cents for r in g["invoices"])
        share = remaining if i == len(items) - 1 else (calc.pct_of(cost, 0) if not base else int(round(cost * b / base)))
        remaining -= share
        delays = [max(0, (r.paid_date - r.due).days) for r in g["invoices"] if r.paid and r.paid_date and r.due]
        rows.append({
            "clientId": client_id, "name": g["name"], "baseCents": b,
            "avgDayCents": round(g["dayAmount"] / g["days"]) if g["days"] else None,
            "avgHourCents": round(g["hourAmount"] / g["hours"]) if g["hours"] else None,
            "expenseShareCents": share,
            "netCents": b - sum(r.irpf_cents for r in g["invoices"]) - sum(reserve_for(r, clients) for r in g["invoices"]) - share,
            "avgDelayDays": round(sum(delays) / len(delays), 1) if delays else None,
        })
    return rows


def goal_calculation(net: float, cost: float, days: float, hours: float, rate: float) -> dict[str, float | None] | None:
    """base = (neto + gastos) / (1 − tasa); tarifa día u hora son ALTERNATIVAS (no se suman)."""
    if rate >= 1:
        return None
    base = (net + cost) / (1 - rate)
    return {"base": base, "day": base / days if days > 0 else None, "hour": base / hours if hours > 0 else None}


def goal_reference(year: int, invoices: Sequence[Any], expenses: Sequence[Any], clients: dict[int, Any]) -> dict[str, Any]:
    inv = [r for r in invoices if r.date.year == year]
    exp = [r for r in expenses if r.date.year == year]
    base = sum(r.base_cents for r in inv)
    rate = (sum(r.irpf_cents for r in inv) + sum(reserve_for(r, clients) for r in inv)) / base if base else 0.15
    suggested = sum(_net_cost(r) for r in exp) / 1200
    return {"year": year, "rate": rate, "hasInvoices": bool(base), "suggestedMonthlyCost": round(suggested, 2)}


# --- simulador de tarifas ----------------------------------------------------


def simulate_rates(
    invoices: Sequence[Any], expenses: Sequence[Any], clients: dict[int, Any], mode: str,
    percent: float = 0.0, day_extra: float = 0.0, hour_extra: float = 0.0,
) -> dict[str, Any]:
    """Mismo volumen, nuevas tarifas. No modifica nada guardado."""
    from decimal import Decimal

    monthly: dict[str, dict[str, Any]] = {}

    def bucket(key: str) -> dict[str, Any]:
        return monthly.setdefault(key, {k: 0 for k in (
            "current", "simulated", "vat", "simVat", "irpf", "simIrpf", "reserve", "simReserve", "cost")} | {"key": key, "days": 0.0, "hours": 0.0})

    for r in invoices:
        row = bucket(r.date.isoformat()[:7])
        client = clients.get(r.client_id)
        reserve_pct = client.extra_irpf if client is not None else r.client_snapshot.get("extraIrpf", 0)
        base = 0
        for line in r.lines:
            quantity, rate = Decimal(str(line["quantity"])), Decimal(str(line["rate"]))
            if mode == "percent":
                new_rate = rate * (1 + Decimal(str(percent)) / 100)
            else:
                new_rate = rate + Decimal(str(day_extra if line["unit"] == "días" else hour_extra))
            base += calc.cents(quantity * calc.cents(new_rate) / 100)
            if line["unit"] == "días":
                row["days"] += float(quantity)
            else:
                row["hours"] += float(quantity)
        row["current"] += r.base_cents
        row["simulated"] += base
        row["vat"] += r.vat_cents
        row["simVat"] += calc.pct_of(base, r.vat)
        row["irpf"] += r.irpf_cents
        row["simIrpf"] += calc.pct_of(base, r.irpf)
        row["reserve"] += calc.pct_of(r.base_cents, reserve_pct)
        row["simReserve"] += calc.pct_of(base, reserve_pct)
    for r in expenses:
        bucket(r.date.isoformat()[:7])["cost"] += _net_cost(r)
    rows = sorted(monthly.values(), key=lambda x: x["key"])
    for row in rows:
        row["net"] = row["current"] - row["irpf"] - row["reserve"] - row["cost"]
        row["simNet"] = row["simulated"] - row["simIrpf"] - row["simReserve"] - row["cost"]
        row["total"] = row["current"] + row["vat"] - row["irpf"]
        row["simTotal"] = row["simulated"] + row["simVat"] - row["simIrpf"]
    totals: dict[str, float] = {}
    for row in rows:
        for k, v in row.items():
            if k != "key":
                totals[k] = totals.get(k, 0) + v
    return {"rows": rows, "totals": totals}
