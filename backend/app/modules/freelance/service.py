"""Servicio de la gestión de autónomo: acceso, CRUD por usuario y resúmenes.

Toda consulta filtra por `user_id`; un registro ajeno responde igual que uno
inexistente (404). Los importes se calculan en el servidor, en céntimos."""

from __future__ import annotations

import calendar
import datetime as dt
import hashlib
import json
from decimal import Decimal
from typing import Any, TypeVar
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemStatus
from app.models.freelance import (
    FreelanceCashSettings,
    FreelanceClient,
    FreelanceExpense,
    FreelanceInvoice,
    FreelanceProfile,
    FreelanceRecurringRule,
    FreelanceTimesheet,
    FreelanceWealthEntry,
    FreelanceWealthPlan,
)
from app.models.user import User
from app.modules.auth.dependencies import is_super_admin
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository
from app.modules.freelance import calc, reports
from app.modules.freelance import schemas as s

PRODUCT_SLUG = "gestion-freelance"
MADRID = ZoneInfo("Europe/Madrid")
MAX_RECURRING_PER_RUN = 1200
T = TypeVar("T")


class FreelanceError(Exception):
    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


def today() -> dt.date:
    return dt.datetime.now(MADRID).date()


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def _nf(what: str = "Not found") -> FreelanceError:
    return FreelanceError(404, "not_found", what)


def _bad(message: str, code: str = "validation_error") -> FreelanceError:
    return FreelanceError(422, code, message)


def _iso(d: dt.date | None) -> str | None:
    return d.isoformat() if d else None


def _num(v: Decimal) -> float:
    return float(v)


# --- serializadores -----------------------------------------------------------


def profile_out(p: FreelanceProfile) -> dict[str, Any]:
    return {"name": p.name, "taxid": p.taxid, "address": p.address, "email": p.email, "iban": p.iban,
            "invoiceColor": p.invoice_color, "logo": p.logo}


def client_out(c: FreelanceClient) -> dict[str, Any]:
    return {"id": c.id, "name": c.name, "taxid": c.taxid, "address": c.address, "email": c.email,
            "startDate": _iso(c.start_date), "paymentRule": c.payment_rule, "paymentDays": c.payment_days,
            "extraIrpf": _num(c.extra_irpf)}


def invoice_out(i: FreelanceInvoice) -> dict[str, Any]:
    return {"id": i.id, "clientId": i.client_id, "number": i.number, "date": _iso(i.date), "due": _iso(i.due),
            "serviceMonth": i.service_month, "description": i.description, "vat": _num(i.vat), "irpf": _num(i.irpf),
            "lines": i.lines, "baseCents": i.base_cents, "vatCents": i.vat_cents, "irpfCents": i.irpf_cents,
            "totalCents": i.total_cents, "paid": i.paid, "paidDate": _iso(i.paid_date),
            "clientSnapshot": i.client_snapshot, "profileSnapshot": i.profile_snapshot}


def expense_out(e: FreelanceExpense) -> dict[str, Any]:
    return {"id": e.id, "supplier": e.supplier, "description": e.description, "reference": e.reference,
            "date": _iso(e.date), "base": _num(e.base), "vat": _num(e.vat), "deductible": _num(e.deductible),
            "vatDeductible": _num(e.vat_deductible), "baseCents": e.base_cents, "vatCents": e.vat_cents,
            "totalCents": e.total_cents, "paid": e.paid, "paidDate": _iso(e.paid_date),
            "recurringRuleId": e.recurring_rule_id}


def plan_out(p: FreelanceWealthPlan) -> dict[str, Any]:
    return {"id": p.id, "category": p.category, "name": p.name, "startMonth": p.start_month, "horizon": p.horizon,
            "annualRate": _num(p.annual_rate), "initialCents": p.initial_cents, "monthlyCents": p.monthly_cents,
            "targetCents": p.target_cents, "active": p.active}


def entry_out(e: FreelanceWealthEntry) -> dict[str, Any]:
    return {"id": e.id, "planId": e.plan_id, "action": e.action, "date": _iso(e.date), "amountCents": e.amount_cents,
            "fromBusiness": e.from_business, "note": e.note}


def _plan_dict(p: FreelanceWealthPlan) -> dict[str, Any]:
    return {**plan_out(p), "annualRate": p.annual_rate}


def _entry_dict(e: FreelanceWealthEntry) -> dict[str, Any]:
    return {"id": e.id, "action": e.action, "date": e.date, "amountCents": e.amount_cents, "fromBusiness": e.from_business}


class FreelanceService:
    def __init__(self, db: Session, user: User):
        self.db, self.user = db, user

    # --- acceso -------------------------------------------------------------

    def assert_product_access(self) -> None:
        """Super admin, producto gratuito, compra directa o plan vivo que lo incluya.
        Se comprueba en CADA petición: si el plan caduca, se bloquea el uso (los datos se conservan)."""
        # El super admin siempre tiene acceso, incluso antes de crear el producto en el catálogo.
        if is_super_admin(self.db, self.user):
            return
        item = self.db.execute(select(CatalogItem).where(CatalogItem.slug == PRODUCT_SLUG)).scalar_one_or_none()
        if item is None or item.status != CatalogItemStatus.published:
            raise _nf("Product not available")
        if item.price is None or item.price <= 0:
            return
        if item.slug not in CatalogPurchasesRepository(self.db).slugs_for_user(self.user.id):
            raise FreelanceError(403, "product_not_owned", "You do not have access to this product")

    # --- helpers ------------------------------------------------------------

    def _live(self, model: type[T]) -> Any:
        stmt = select(model).where(model.user_id == self.user.id)  # type: ignore[attr-defined]
        if hasattr(model, "deleted_at"):
            stmt = stmt.where(model.deleted_at.is_(None))  # type: ignore[attr-defined]
        return stmt

    def _all(self, model: type[T], *order: Any) -> list[T]:
        return list(self.db.execute(self._live(model).order_by(*order)).scalars().all())

    def _get(self, model: type[T], row_id: int) -> T:
        row = self.db.execute(self._live(model).where(model.id == row_id)).scalar_one_or_none()  # type: ignore[attr-defined]
        if row is None:
            raise _nf()
        return row

    def _commit(self) -> None:
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            raise FreelanceError(409, "conflict", "Conflicto al guardar; inténtalo de nuevo") from exc

    # --- perfil y caja ------------------------------------------------------

    def get_profile(self) -> dict[str, Any] | None:
        row = self.db.execute(select(FreelanceProfile).where(FreelanceProfile.user_id == self.user.id)).scalar_one_or_none()
        return profile_out(row) if row else None

    def save_profile(self, data: s.ProfileIn) -> dict[str, Any]:
        row = self.db.execute(select(FreelanceProfile).where(FreelanceProfile.user_id == self.user.id)).scalar_one_or_none()
        if row is None:
            row = FreelanceProfile(user_id=self.user.id)
            self.db.add(row)
        row.name, row.taxid, row.address, row.email, row.iban = data.name, data.taxid, data.address, data.email, data.iban
        row.invoice_color, row.logo = data.invoice_color, data.logo
        self._commit()
        return profile_out(row)

    def _settings(self) -> FreelanceCashSettings | None:
        return self.db.execute(select(FreelanceCashSettings).where(FreelanceCashSettings.user_id == self.user.id)).scalar_one_or_none()

    def get_cash_settings(self) -> dict[str, Any]:
        r = self._settings()
        return {"openingBalance": _num(r.opening_balance) if r else 0, "withdrawals": _num(r.withdrawals) if r else 0,
                "vatPaid": _num(r.vat_paid) if r else 0, "extraIrpfUsed": _num(r.extra_irpf_used) if r else 0}

    def save_cash_settings(self, data: s.CashSettingsIn) -> dict[str, Any]:
        r = self._settings()
        if r is None:
            r = FreelanceCashSettings(user_id=self.user.id)
            self.db.add(r)
        r.opening_balance, r.withdrawals, r.vat_paid, r.extra_irpf_used = (
            data.opening_balance, data.withdrawals, data.vat_paid, data.extra_irpf_used)
        self._commit()
        return self.get_cash_settings()

    # --- clientes -----------------------------------------------------------

    def list_clients(self) -> list[dict[str, Any]]:
        return [client_out(c) for c in self._all(FreelanceClient, FreelanceClient.name)]

    def save_client(self, data: s.ClientIn, client_id: int | None = None) -> dict[str, Any]:
        row = self._get(FreelanceClient, client_id) if client_id else FreelanceClient(user_id=self.user.id)
        for k, v in (("name", data.name), ("taxid", data.taxid), ("address", data.address), ("email", data.email),
                     ("start_date", data.start_date), ("payment_rule", data.payment_rule),
                     ("payment_days", data.payment_days), ("extra_irpf", data.extra_irpf)):
            setattr(row, k, v)
        self.db.add(row)
        self._commit()
        return client_out(row)

    def delete_client(self, client_id: int) -> None:
        row = self._get(FreelanceClient, client_id)
        used = self.db.execute(select(func.count()).select_from(FreelanceInvoice).where(
            FreelanceInvoice.user_id == self.user.id, FreelanceInvoice.client_id == row.id,
            FreelanceInvoice.deleted_at.is_(None))).scalar_one()
        if used:
            raise FreelanceError(409, "client_in_use", "El cliente tiene facturas; elimínalas primero")
        row.deleted_at = _now()
        self._commit()

    # --- facturas -----------------------------------------------------------

    def list_invoices(self) -> list[dict[str, Any]]:
        return [invoice_out(i) for i in self._all(FreelanceInvoice, FreelanceInvoice.date.desc(), FreelanceInvoice.id.desc())]

    def get_invoice(self, invoice_id: int) -> FreelanceInvoice:
        return self._get(FreelanceInvoice, invoice_id)

    def _next_number(self, year: int) -> str:
        """Numeración AAAA-NNNN única por usuario. Cuenta también las eliminadas (no se reutilizan)."""
        numbers = self.db.execute(select(FreelanceInvoice.number).where(FreelanceInvoice.user_id == self.user.id)).scalars().all()
        last = max((int(n.rsplit("-", 1)[1]) for n in numbers), default=0)
        return f"{year}-{last + 1:04d}"

    def create_invoice(self, data: s.InvoiceIn) -> dict[str, Any]:
        client = self._get(FreelanceClient, data.client_id)
        profile = self.db.execute(select(FreelanceProfile).where(FreelanceProfile.user_id == self.user.id)).scalar_one_or_none()
        if profile is None:
            raise _bad("Guarda tus datos fiscales antes de crear la factura", "profile_required")
        # Bloqueo por usuario: dos altas simultáneas no pueden obtener el mismo número.
        self.db.execute(select(User.id).where(User.id == self.user.id).with_for_update())
        lines, base = calc.invoice_lines([ln.model_dump() for ln in data.lines])
        totals = calc.invoice_totals(base, data.vat, data.irpf)
        row = FreelanceInvoice(
            user_id=self.user.id, client_id=client.id, number=self._next_number(data.date.year), date=data.date,
            due=calc.due_date(client.payment_rule, client.payment_days, data.date, data.due),
            service_month=data.service_month, description=data.description, vat=data.vat, irpf=data.irpf, lines=lines,
            base_cents=totals["baseCents"], vat_cents=totals["vatCents"], irpf_cents=totals["irpfCents"],
            total_cents=totals["totalCents"], paid=False, client_snapshot=client_out(client),
            profile_snapshot=profile_out(profile),
        )
        self.db.add(row)
        self._commit()
        return invoice_out(row)

    def set_invoice_payment(self, invoice_id: int, data: s.PaymentIn) -> dict[str, Any]:
        row = self._get(FreelanceInvoice, invoice_id)
        row.paid = data.paid
        row.paid_date = (data.paid_date or today()) if data.paid else None
        self._commit()
        return invoice_out(row)

    def delete_invoice(self, invoice_id: int) -> None:
        self._get(FreelanceInvoice, invoice_id).deleted_at = _now()
        self._commit()

    def invoice_pdf(self, invoice_id: int) -> tuple[bytes, str]:
        row = self._get(FreelanceInvoice, invoice_id)
        from app.modules.freelance import pdf  # import diferido: reportlab solo hace falta al generar PDFs

        branding = {"invoiceColor": row.profile_snapshot.get("invoiceColor", "#176b52"), "logo": row.profile_snapshot.get("logo")}
        return pdf.generate_invoice(invoice_out(row), branding), f"factura-{row.number}.pdf"

    # --- gastos y recurrentes -------------------------------------------------

    def list_expenses(self) -> list[dict[str, Any]]:
        return [expense_out(e) for e in self._all(FreelanceExpense, FreelanceExpense.date.desc(), FreelanceExpense.id.desc())]

    def _fill_expense(self, row: FreelanceExpense, d: s.ExpenseIn) -> None:
        t = calc.expense_totals(d.base, d.vat)
        row.supplier, row.description, row.reference, row.date = d.supplier, d.description, d.reference, d.date
        row.base, row.vat, row.deductible, row.vat_deductible = d.base, d.vat, d.deductible, d.vat_deductible
        row.base_cents, row.vat_cents, row.total_cents = t["baseCents"], t["vatCents"], t["totalCents"]
        row.paid = d.paid
        row.paid_date = (d.paid_date or d.date) if d.paid else None

    def save_expense(self, data: s.ExpenseIn, expense_id: int | None = None) -> dict[str, Any]:
        row = self._get(FreelanceExpense, expense_id) if expense_id else FreelanceExpense(user_id=self.user.id)
        self._fill_expense(row, data)
        self.db.add(row)
        self._commit()
        return expense_out(row)

    def delete_expense(self, expense_id: int) -> None:
        self._get(FreelanceExpense, expense_id).deleted_at = _now()
        self._commit()

    def list_recurring(self) -> list[dict[str, Any]]:
        return [{"id": r.id, "nextDate": _iso(r.next_date), "day": r.day, "active": r.active, "template": r.template}
                for r in self._all(FreelanceRecurringRule, FreelanceRecurringRule.id)]

    def save_recurring(self, data: s.RecurringIn, rule_id: int | None = None) -> dict[str, Any]:
        row = self._get(FreelanceRecurringRule, rule_id) if rule_id else FreelanceRecurringRule(user_id=self.user.id)
        row.next_date, row.day, row.active = data.start_date, data.day, data.active
        row.template = json.loads(data.expense.model_dump_json(by_alias=True, exclude={"date", "paid", "paid_date"}))
        self.db.add(row)
        self._commit()
        return {"id": row.id, "nextDate": _iso(row.next_date), "day": row.day, "active": row.active, "template": row.template}

    def delete_recurring(self, rule_id: int) -> None:
        self._get(FreelanceRecurringRule, rule_id).deleted_at = _now()
        self._commit()

    def generate_recurring(self) -> int:
        """Crea los gastos vencidos de las reglas activas. Idempotente: el índice único
        (regla, fecha) impide duplicados aunque coincidan el planificador y una petición."""
        created = 0
        for rule in self._all(FreelanceRecurringRule):
            if not rule.active:
                continue
            date = rule.next_date
            while date <= today():
                if created >= MAX_RECURRING_PER_RUN:
                    raise _bad("Demasiados gastos a generar; revisa las fechas de recurrencia")
                exists = self.db.execute(select(FreelanceExpense.id).where(
                    FreelanceExpense.recurring_rule_id == rule.id, FreelanceExpense.date == date)).first()
                if not exists:
                    tpl = s.ExpenseIn.model_validate({**rule.template, "date": date, "paid": False})
                    exp = FreelanceExpense(user_id=self.user.id, recurring_rule_id=rule.id)
                    self._fill_expense(exp, tpl)
                    self.db.add(exp)
                    created += 1
                date = calc.next_occurrence(date, rule.day)
            rule.next_date = date
        self._commit()
        return created

    # --- calendario ---------------------------------------------------------

    def get_timesheet(self, month: str) -> dict[str, Any]:
        s._month(month)
        row = self.db.execute(select(FreelanceTimesheet).where(
            FreelanceTimesheet.user_id == self.user.id, FreelanceTimesheet.month == month)).scalar_one_or_none()
        stats = reports.calendar_stats(month, row)
        return {"month": month, "vacations": row.vacations if row else [], "holidays": row.holidays if row else [],
                "weekdays": stats["weekdays"], "vacationDays": stats["vacations"],
                "holidayDays": stats["holidays"], "available": stats["available"]}

    def save_timesheet(self, month: str, data: s.TimesheetIn) -> dict[str, Any]:
        s._month(month)
        for d in [*data.vacations, *data.holidays]:
            if d.isoformat()[:7] != month:
                raise _bad("Hay fechas fuera del mes indicado")
        row = self.db.execute(select(FreelanceTimesheet).where(
            FreelanceTimesheet.user_id == self.user.id, FreelanceTimesheet.month == month)).scalar_one_or_none()
        if row is None:
            row = FreelanceTimesheet(user_id=self.user.id, month=month)
            self.db.add(row)
        row.vacations = sorted({d.isoformat() for d in data.vacations})
        row.holidays = sorted({d.isoformat() for d in data.holidays})
        self._commit()
        return self.get_timesheet(month)

    def timesheet_pdf(self, month: str) -> tuple[bytes, str]:
        from app.modules.freelance import pdf

        record = self.get_timesheet(month)
        profile = self.get_profile() or {}
        return pdf.generate_timesheet(month, record, profile), f"timesheet-{month}.pdf"

    # --- patrimonio ---------------------------------------------------------

    def _entries(self, plan_id: int | None = None) -> list[FreelanceWealthEntry]:
        stmt = self._live(FreelanceWealthEntry)
        if plan_id is not None:
            stmt = stmt.where(FreelanceWealthEntry.plan_id == plan_id)
        return list(self.db.execute(stmt.order_by(FreelanceWealthEntry.date, FreelanceWealthEntry.id)).scalars().all())

    def list_wealth(self) -> dict[str, Any]:
        entries = self._entries()
        out = []
        for p in self._all(FreelanceWealthPlan, FreelanceWealthPlan.id):
            mine = [_entry_dict(e) for e in entries if e.plan_id == p.id]
            out.append({**plan_out(p), "projection": calc.wealth_projection(_plan_dict(p)),
                        "actual": calc.wealth_actual(_plan_dict(p), mine, today())})
        return {"plans": out, "entries": [entry_out(e) for e in entries]}

    def save_plan(self, data: s.WealthPlanIn, plan_id: int | None = None) -> dict[str, Any]:
        row = self._get(FreelanceWealthPlan, plan_id) if plan_id else FreelanceWealthPlan(user_id=self.user.id)
        row.category, row.name, row.start_month, row.horizon = data.category, data.name, data.start_month, data.horizon
        row.annual_rate, row.active = data.annual_rate, data.active
        row.initial_cents, row.monthly_cents, row.target_cents = calc.cents(data.initial), calc.cents(data.monthly), calc.cents(data.target)
        if plan_id:
            self._check_ledger(row, self._entries(row.id))
        self.db.add(row)
        self._commit()
        return plan_out(row)

    def delete_plan(self, plan_id: int) -> None:
        row = self._get(FreelanceWealthPlan, plan_id)
        if self._entries(row.id):
            raise FreelanceError(409, "plan_in_use", "El plan tiene movimientos; elimínalos primero")
        row.deleted_at = _now()
        self._commit()

    @staticmethod
    def _check_ledger(plan: FreelanceWealthPlan, entries: list[FreelanceWealthEntry]) -> None:
        try:
            calc.validate_ledger(_plan_dict(plan), [_entry_dict(e) for e in entries])
        except ValueError as exc:
            raise _bad(str(exc), "ledger_invalid") from exc

    def add_entry(self, plan_id: int, data: s.WealthEntryIn) -> dict[str, Any]:
        plan = self._get(FreelanceWealthPlan, plan_id)
        if data.action == "valuation" and data.from_business:
            raise _bad("Una valoración no mueve caja")
        row = FreelanceWealthEntry(user_id=self.user.id, plan_id=plan.id, action=data.action, date=data.date,
                                   amount_cents=calc.cents(data.amount), from_business=data.from_business, note=data.note)
        self.db.add(row)
        self.db.flush()
        self._check_ledger(plan, self._entries(plan.id))
        self._commit()
        return entry_out(row)

    def delete_entry(self, entry_id: int) -> None:
        row = self._get(FreelanceWealthEntry, entry_id)
        row.deleted_at = _now()
        self.db.flush()
        self._check_ledger(self._get(FreelanceWealthPlan, row.plan_id), self._entries(row.plan_id))
        self._commit()

    # --- informes -----------------------------------------------------------

    def _data(self) -> tuple[list[FreelanceInvoice], list[FreelanceExpense], dict[int, FreelanceClient]]:
        inv = self._all(FreelanceInvoice, FreelanceInvoice.date)
        exp = self._all(FreelanceExpense, FreelanceExpense.date)
        clients = {c.id: c for c in self._all(FreelanceClient)}
        return inv, exp, clients

    def _transfers(self, until: dt.date) -> int:
        return calc.wealth_cash_transfers([{**_entry_dict(e)} for e in self._entries()], until)

    def summary(self) -> dict[str, Any]:
        inv, exp, clients = self._data()
        now = today()
        rules = self._all(FreelanceRecurringRule)
        entries = [_entry_dict(e) for e in self._entries()]
        plans = self._all(FreelanceWealthPlan)

        def planned(until: dt.date) -> int:
            """Aportaciones mensuales previstas (fin de mes) de planes activos entre hoy y `until`."""
            total = 0
            for p in plans:
                if not p.active:
                    continue
                for i in range(p.horizon):
                    key = calc.add_months(p.start_month, i)
                    y, m = int(key[:4]), int(key[5:7])
                    end = dt.date(y, m, calendar.monthrange(y, m)[1])
                    if now < end <= until:
                        total += p.monthly_cents
            return total

        return {
            "today": now.isoformat(),
            "cash": reports.cash_data(now, inv, exp, self._settings(), clients, calc.wealth_cash_transfers(entries, now)),
            "forecast": reports.forecast_data(now, inv, exp, rules, planned),
            "notices": reports.payment_notices(now, inv),
            "receivable": {"cents": sum(i.total_cents for i in inv if not i.paid), "count": sum(1 for i in inv if not i.paid)},
            "payable": {"cents": sum(e.total_cents for e in exp if not e.paid), "count": sum(1 for e in exp if not e.paid)},
        }

    def dashboard(self, year: int, concept: str = "") -> dict[str, Any]:
        inv, exp, clients = self._data()
        sheets = {t.month: t for t in self._all(FreelanceTimesheet)}
        rows = reports.monthly_dashboard(year, range(1, 13), inv, exp, clients, sheets, concept)
        return {"year": year, "months": rows, "profitability": reports.profitability(
            [i for i in inv if i.date.year == year], [e for e in exp if e.date.year == year], clients)}

    def goal(self, year: int, net: float, cost: float, days: float, hours: float, rate: float | None) -> dict[str, Any]:
        inv, exp, clients = self._data()
        ref = reports.goal_reference(year, inv, exp, clients)
        result = reports.goal_calculation(net, cost, days, hours, ref["rate"] if rate is None else rate)
        return {"reference": ref, "result": result}

    def simulate(self, data: s.SimulatorIn) -> dict[str, Any]:
        inv, exp, clients = self._data()
        return reports.simulate_rates(inv, exp, clients, data.mode, data.percent, data.day_extra, data.hour_extra)

    # --- copia de seguridad (solo del propio usuario) ---------------------------

    def export_backup(self) -> dict[str, Any]:
        payload = {
            "profile": self.get_profile(), "cashSettings": self.get_cash_settings(), "clients": self.list_clients(),
            "invoices": self.list_invoices(), "expenses": self.list_expenses(), "recurring": self.list_recurring(),
            "wealth": self.list_wealth(),
        }
        canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()
        return {"app": "ase-freelance-backup", "version": 1, "created": _now().isoformat(),
                "checksum": hashlib.sha256(canonical).hexdigest(), "data": payload}


def run_recurring_sweep(db: Session) -> int:
    """Tarea diaria: genera los gastos recurrentes vencidos de todos los usuarios con reglas
    activas. Es idempotente (índice único regla+fecha) y un fallo de un usuario no frena a los demás."""
    user_ids = db.execute(select(FreelanceRecurringRule.user_id).where(
        FreelanceRecurringRule.active.is_(True), FreelanceRecurringRule.deleted_at.is_(None),
        FreelanceRecurringRule.next_date <= today()).distinct()).scalars().all()
    created = 0
    for uid in user_ids:
        user = db.get(User, uid)
        if user is None:
            continue
        try:
            created += FreelanceService(db, user).generate_recurring()
        except Exception:  # noqa: BLE001
            db.rollback()
    return created
