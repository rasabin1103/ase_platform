"""Importa tus datos de Cuenta Clara (SQLite `data/autonomo.db`) a la gestión de
autónomo de ASE, en la cuenta de un usuario.

Uso (desde backend/, con el venv activado y DATABASE_URL apuntando a la BD destino):

    python -m scripts.import_cuenta_clara --sqlite RUTA/autonomo.db --email tu@correo.com --dry-run
    python -m scripts.import_cuenta_clara --sqlite RUTA/autonomo.db --email tu@correo.com

Reglas: nunca borra nada; si el usuario ya tiene datos de autónomo aborta salvo
--force (que solo AÑADE). Todo se guarda en una única transacción: si algo falla,
no queda nada a medias. Se conservan los números de factura y se reservan los de
facturas eliminadas para no reutilizarlos. La cartera de inversión (CSV) no se importa aún."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import sqlite3
import sys
from decimal import Decimal
from pathlib import Path
from typing import Any


def read_records(path: Path) -> list[tuple[int, str, dict[str, Any]]]:
    if not path.is_file():
        raise SystemExit(f"No existe el archivo: {path}\nPon la ruta REAL de autonomo.db (suele estar en la carpeta data de Cuenta Clara).")
    con = sqlite3.connect(str(path))
    try:
        return [(r[0], r[1], json.loads(r[2])) for r in con.execute("SELECT id, kind, data FROM records ORDER BY id")]
    finally:
        con.close()


def d(value: Any) -> dt.date | None:
    return dt.date.fromisoformat(value) if value else None


def run(args: argparse.Namespace) -> int:
    records = read_records(Path(args.sqlite))
    by_kind: dict[str, list[tuple[int, dict[str, Any]]]] = {}
    for rid, kind, data in records:
        by_kind.setdefault(kind, []).append((rid, data))
    print("Registros encontrados:", {k: len(v) for k, v in sorted(by_kind.items())})
    if args.dry_run:
        print("Simulación: no se ha escrito nada.")
        return 0

    from sqlalchemy import select

    from app.core.database import SessionLocal
    from app.models.freelance import (
        FreelanceCashSettings, FreelanceClient, FreelanceExpense, FreelanceInvoice, FreelanceProfile,
        FreelanceRecurringRule, FreelanceTimesheet, FreelanceWealthEntry, FreelanceWealthPlan,
    )
    from app.models.user import User

    db = SessionLocal()
    try:
        user = db.execute(select(User).where(User.email == args.email)).scalar_one_or_none()
        if user is None:
            print(f"No existe ningún usuario con el correo {args.email}")
            return 1
        uid = user.id
        has = any(db.execute(select(m.id).where(m.user_id == uid)).first() for m in (FreelanceClient, FreelanceInvoice, FreelanceExpense, FreelanceProfile))
        if has and not args.force:
            print("Ese usuario ya tiene datos de autónomo. Usa --force para AÑADIR igualmente (no borra nada).")
            return 1

        # Perfil (uno por usuario): solo se crea si no existe.
        if by_kind.get("profile") and not db.execute(select(FreelanceProfile.id).where(FreelanceProfile.user_id == uid)).first():
            p = by_kind["profile"][-1][1]
            db.add(FreelanceProfile(
                user_id=uid, name=p["name"], taxid=p["taxid"], address=p["address"], email=p.get("email", ""),
                iban=p.get("iban", ""), invoice_color=p.get("invoiceColor", "#176b52"), logo=p.get("logo") or None))

        if by_kind.get("cashsettings") and not db.execute(select(FreelanceCashSettings.id).where(FreelanceCashSettings.user_id == uid)).first():
            c = by_kind["cashsettings"][-1][1]
            db.add(FreelanceCashSettings(
                user_id=uid, opening_balance=Decimal(c.get("openingBalance", 0)), withdrawals=Decimal(c.get("withdrawals", 0)),
                vat_paid=Decimal(c.get("vatPaid", 0)), extra_irpf_used=Decimal(c.get("extraIrpfUsed", 0))))

        client_map: dict[int, int] = {}
        for rid, c in by_kind.get("client", []):
            row = FreelanceClient(
                user_id=uid, name=c["name"], taxid=c["taxid"], address=c["address"], email=c.get("email", ""),
                start_date=d(c.get("startDate")), payment_rule=c.get("paymentRule", "nextMonth"),
                payment_days=int(c.get("paymentDays", 60)), extra_irpf=Decimal(str(c.get("extraIrpf", 0))))
            db.add(row)
            db.flush()
            client_map[rid] = row.id

        n_inv = 0
        for kind in ("invoice", "deleted_invoice"):
            for _rid, i in by_kind.get(kind, []):
                old = int(i["client"])
                if old not in client_map:
                    print(f"  Aviso: la factura {i.get('number')} referencia un cliente que no existe; se omite")
                    continue
                db.add(FreelanceInvoice(
                    user_id=uid, client_id=client_map[old], number=i["number"], date=d(i["date"]), due=d(i.get("due")),
                    service_month=i.get("serviceMonth") or None, description=i["description"], vat=Decimal(str(i["vat"])),
                    irpf=Decimal(str(i["irpf"])), lines=i["lines"], base_cents=i["baseCents"], vat_cents=i["vatCents"],
                    irpf_cents=i["irpfCents"], total_cents=i["totalCents"], paid=bool(i.get("paid", False)),
                    paid_date=d(i.get("paidDate")) or (d(i["date"]) if i.get("paid") else None),
                    client_snapshot=i["clientSnapshot"], profile_snapshot=i["profileSnapshot"],
                    deleted_at=dt.datetime.now(dt.timezone.utc) if kind == "deleted_invoice" else None))
                n_inv += 1

        rule_map: dict[int, int] = {}
        for rid, r in by_kind.get("recurring", []):
            row = FreelanceRecurringRule(
                user_id=uid, next_date=d(r["nextDate"]), day=int(r["day"]), template=r["template"], active=bool(r.get("active", True)))
            db.add(row)
            db.flush()
            rule_map[rid] = row.id

        for _rid, e in by_kind.get("expense", []):
            paid = e.get("paid", True) in (True, "true")
            db.add(FreelanceExpense(
                user_id=uid, supplier=e["supplier"], description=e["description"], reference=e.get("reference", ""),
                date=d(e["date"]), base=Decimal(str(e["base"])), vat=Decimal(str(e["vat"])),
                deductible=Decimal(str(e.get("deductible", 100))), vat_deductible=Decimal(str(e.get("vatDeductible", 100))),
                base_cents=e["baseCents"], vat_cents=e["vatCents"], total_cents=e["totalCents"], paid=paid,
                paid_date=d(e["date"]) if paid else None,
                recurring_rule_id=rule_map.get(int(e["recurringId"])) if e.get("recurringId") else None))

        for _rid, t in by_kind.get("timesheet", []):
            if not db.execute(select(FreelanceTimesheet.id).where(FreelanceTimesheet.user_id == uid, FreelanceTimesheet.month == t["month"])).first():
                db.add(FreelanceTimesheet(user_id=uid, month=t["month"], vacations=t.get("vacations", []), holidays=t.get("holidays", [])))

        plan_map: dict[int, int] = {}
        for rid, p in by_kind.get("wealthplan", []):
            row = FreelanceWealthPlan(
                user_id=uid, category=p["category"], name=p["name"], start_month=p["startMonth"], horizon=int(p["horizon"]),
                annual_rate=Decimal(str(p.get("annualRate", 0))), initial_cents=p["initialCents"], monthly_cents=p["monthlyCents"],
                target_cents=p["targetCents"], active=bool(p.get("active", True)))
            db.add(row)
            db.flush()
            plan_map[rid] = row.id
        n_ent = 0
        for _rid, w in by_kind.get("wealthentry", []):
            if int(w["planId"]) in plan_map:
                db.add(FreelanceWealthEntry(
                    user_id=uid, plan_id=plan_map[int(w["planId"])], action=w["action"], date=d(w["date"]),
                    amount_cents=w["amountCents"], from_business=bool(w.get("fromBusiness", False)), note=w.get("note", "")))
                n_ent += 1

        db.commit()
        print(f"Importado en {args.email}: {len(client_map)} clientes, {n_inv} facturas, {len(by_kind.get('expense', []))} gastos, "
              f"{len(rule_map)} recurrentes, {len(plan_map)} planes, {n_ent} movimientos.")
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--sqlite", required=True, help="Ruta a autonomo.db de Cuenta Clara")
    ap.add_argument("--email", required=True, help="Correo del usuario de ASE que recibirá los datos")
    ap.add_argument("--dry-run", action="store_true", help="Solo cuenta registros, no escribe")
    ap.add_argument("--force", action="store_true", help="Añadir aunque el usuario ya tenga datos")
    sys.exit(run(ap.parse_args()))
