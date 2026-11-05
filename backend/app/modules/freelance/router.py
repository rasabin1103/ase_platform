from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.freelance import schemas as s
from app.modules.freelance.service import FreelanceError, FreelanceService, today

router = APIRouter(prefix="/api/v1/freelance", tags=["freelance"])


def authorized(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> FreelanceService:
    svc = FreelanceService(db, user)
    svc.assert_product_access()
    return svc


async def freelance_error_handler(_request: Any, exc: FreelanceError) -> JSONResponse:
    return JSONResponse(status_code=exc.status, content={"detail": {"code": exc.code, "message": exc.message}})


Svc = Depends(authorized)


@router.get("/access")
def access(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, bool]:
    """Para que el menú sepa si mostrar el módulo, sin devolver 403."""
    try:
        FreelanceService(db, user).assert_product_access()
        return {"allowed": True}
    except FreelanceError:
        return {"allowed": False}


@router.get("/summary")
def summary(svc: FreelanceService = Svc) -> dict[str, Any]:
    svc.generate_recurring()
    return svc.summary()


@router.get("/dashboard")
def dashboard(year: int = Query(default_factory=lambda: today().year, ge=2000, le=2100), concept: str = Query("", max_length=100),
              svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.dashboard(year, concept)


@router.get("/goal")
def goal(year: int = Query(default_factory=lambda: today().year, ge=2000, le=2100), net: float = Query(0, ge=0, le=1e9),
         cost: float = Query(0, ge=0, le=1e9), days: float = Query(0, ge=0, le=366), hours: float = Query(0, ge=0, le=9000),
         rate: float | None = Query(None, ge=0, lt=1), svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.goal(year, net, cost, days, hours, rate)


@router.post("/simulator")
def simulator(data: s.SimulatorIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.simulate(data)


@router.get("/profile")
def get_profile(svc: FreelanceService = Svc) -> dict[str, Any] | None:
    return svc.get_profile()


@router.put("/profile")
def put_profile(data: s.ProfileIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.save_profile(data)


@router.get("/cash-settings")
def get_cash(svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.get_cash_settings()


@router.put("/cash-settings")
def put_cash(data: s.CashSettingsIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.save_cash_settings(data)


@router.get("/clients")
def clients(svc: FreelanceService = Svc) -> list[dict[str, Any]]:
    return svc.list_clients()


@router.post("/clients", status_code=201)
def create_client(data: s.ClientIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.save_client(data)


@router.put("/clients/{client_id}")
def update_client(client_id: int, data: s.ClientIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.save_client(data, client_id)


@router.delete("/clients/{client_id}", status_code=204)
def delete_client(client_id: int, svc: FreelanceService = Svc) -> Response:
    svc.delete_client(client_id)
    return Response(status_code=204)


@router.get("/invoices")
def invoices(svc: FreelanceService = Svc) -> list[dict[str, Any]]:
    return svc.list_invoices()


@router.post("/invoices", status_code=201)
def create_invoice(data: s.InvoiceIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.create_invoice(data)


@router.put("/invoices/{invoice_id}/payment")
def invoice_payment(invoice_id: int, data: s.PaymentIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.set_invoice_payment(invoice_id, data)


@router.delete("/invoices/{invoice_id}", status_code=204)
def delete_invoice(invoice_id: int, svc: FreelanceService = Svc) -> Response:
    svc.delete_invoice(invoice_id)
    return Response(status_code=204)


@router.get("/invoices/{invoice_id}/pdf")
def invoice_pdf(invoice_id: int, svc: FreelanceService = Svc) -> Response:
    data, name = svc.invoice_pdf(invoice_id)
    return Response(data, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{name}"', "Cache-Control": "no-store"})


@router.get("/expenses")
def expenses(svc: FreelanceService = Svc) -> list[dict[str, Any]]:
    return svc.list_expenses()


@router.post("/expenses", status_code=201)
def create_expense(data: s.ExpenseIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.save_expense(data)


@router.put("/expenses/{expense_id}")
def update_expense(expense_id: int, data: s.ExpenseIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.save_expense(data, expense_id)


@router.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: int, svc: FreelanceService = Svc) -> Response:
    svc.delete_expense(expense_id)
    return Response(status_code=204)


@router.get("/recurring")
def recurring(svc: FreelanceService = Svc) -> list[dict[str, Any]]:
    return svc.list_recurring()


@router.post("/recurring", status_code=201)
def create_recurring(data: s.RecurringIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.save_recurring(data)


@router.put("/recurring/{rule_id}")
def update_recurring(rule_id: int, data: s.RecurringIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.save_recurring(data, rule_id)


@router.delete("/recurring/{rule_id}", status_code=204)
def delete_recurring(rule_id: int, svc: FreelanceService = Svc) -> Response:
    svc.delete_recurring(rule_id)
    return Response(status_code=204)


@router.get("/timesheets/{month}")
def get_timesheet(month: str, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.get_timesheet(month)


@router.put("/timesheets/{month}")
def put_timesheet(month: str, data: s.TimesheetIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.save_timesheet(month, data)


@router.get("/timesheets/{month}/pdf")
def timesheet_pdf(month: str, svc: FreelanceService = Svc) -> Response:
    data, name = svc.timesheet_pdf(month)
    return Response(data, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{name}"', "Cache-Control": "no-store"})


@router.get("/wealth")
def wealth(svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.list_wealth()


@router.post("/wealth/plans", status_code=201)
def create_plan(data: s.WealthPlanIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.save_plan(data)


@router.put("/wealth/plans/{plan_id}")
def update_plan(plan_id: int, data: s.WealthPlanIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.save_plan(data, plan_id)


@router.delete("/wealth/plans/{plan_id}", status_code=204)
def delete_plan(plan_id: int, svc: FreelanceService = Svc) -> Response:
    svc.delete_plan(plan_id)
    return Response(status_code=204)


@router.post("/wealth/plans/{plan_id}/entries", status_code=201)
def add_entry(plan_id: int, data: s.WealthEntryIn, svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.add_entry(plan_id, data)


@router.delete("/wealth/entries/{entry_id}", status_code=204)
def delete_entry(entry_id: int, svc: FreelanceService = Svc) -> Response:
    svc.delete_entry(entry_id)
    return Response(status_code=204)


@router.get("/backup")
def backup(svc: FreelanceService = Svc) -> dict[str, Any]:
    return svc.export_backup()
