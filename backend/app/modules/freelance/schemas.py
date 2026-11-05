"""DTOs de entrada de la gestión de autónomo (camelCase en la API)."""

from __future__ import annotations

import base64
import datetime as dt
import re
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel

from app.modules.freelance.calc import MAX_AMOUNT

MONTH_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")
COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
MAX_LOGO_BYTES = 500 * 1024

Money = Annotated[Decimal, Field(ge=0, le=MAX_AMOUNT, max_digits=14, decimal_places=2)]
Percent = Annotated[Decimal, Field(ge=0, le=100, max_digits=7, decimal_places=2)]
Text = Annotated[str, Field(max_length=500)]


class _In(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="forbid", str_strip_whitespace=True)


def _month(value: str) -> str:
    if not MONTH_RE.match(value):
        raise ValueError("Mes inválido (AAAA-MM)")
    return value


class ProfileIn(_In):
    name: Annotated[str, Field(min_length=1, max_length=200)]
    taxid: Annotated[str, Field(min_length=1, max_length=40)]
    address: Annotated[str, Field(min_length=1, max_length=500)]
    email: Annotated[str, Field(max_length=200)] = ""
    iban: Annotated[str, Field(max_length=60)] = ""
    invoice_color: str = "#176b52"
    logo: str | None = None

    @field_validator("invoice_color")
    @classmethod
    def _color(cls, v: str) -> str:
        if not COLOR_RE.match(v):
            raise ValueError("Color inválido")
        return v.lower()

    @field_validator("logo")
    @classmethod
    def _logo(cls, v: str | None) -> str | None:
        """Data URL PNG/JPEG/WebP; se comprueba la firma real, no solo el prefijo."""
        if not v:
            return None
        m = re.match(r"^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$", v)
        if not m:
            raise ValueError("Logo: solo PNG, JPEG o WebP en base64")
        try:
            raw = base64.b64decode(m.group(2), validate=True)
        except Exception as exc:  # noqa: BLE001
            raise ValueError("Logo no válido") from exc
        if len(raw) > MAX_LOGO_BYTES:
            raise ValueError("Logo demasiado grande (máx. 500 KB)")
        magic = {"png": raw[:8] == b"\x89PNG\r\n\x1a\n", "jpeg": raw[:3] == b"\xff\xd8\xff",
                 "webp": raw[:4] == b"RIFF" and raw[8:12] == b"WEBP"}
        if not magic[m.group(1)]:
            raise ValueError("El contenido del logo no coincide con su formato")
        return v


class ClientIn(_In):
    name: Annotated[str, Field(min_length=1, max_length=200)]
    taxid: Annotated[str, Field(min_length=1, max_length=40)]
    address: Annotated[str, Field(min_length=1, max_length=500)]
    email: Annotated[str, Field(max_length=200)] = ""
    start_date: dt.date | None = None
    payment_rule: Literal["nextMonth", "days"] = "nextMonth"
    payment_days: Annotated[int, Field(ge=0, le=365)] = 60
    extra_irpf: Percent = Decimal("0")


class InvoiceLineIn(_In):
    description: Annotated[str, Field(min_length=1, max_length=500)]
    unit: Literal["días", "horas"]
    quantity: Annotated[Decimal, Field(gt=0, le=MAX_AMOUNT, max_digits=14, decimal_places=2)]
    rate: Annotated[Decimal, Field(ge=0, le=MAX_AMOUNT, max_digits=14, decimal_places=2)]


class InvoiceIn(_In):
    client_id: int
    date: dt.date
    due: dt.date | None = None
    service_month: str | None = None
    description: Annotated[str, Field(min_length=1, max_length=1000)]
    vat: Percent = Decimal("21")
    irpf: Percent = Decimal("15")
    lines: Annotated[list[InvoiceLineIn], Field(min_length=1, max_length=100)]

    @field_validator("service_month")
    @classmethod
    def _sm(cls, v: str | None) -> str | None:
        return _month(v) if v else None


class PaymentIn(_In):
    paid: bool
    paid_date: dt.date | None = None


class ExpenseIn(_In):
    supplier: Annotated[str, Field(min_length=1, max_length=200)]
    description: Annotated[str, Field(min_length=1, max_length=1000)]
    reference: Annotated[str, Field(max_length=120)] = ""
    date: dt.date
    base: Money
    vat: Percent = Decimal("21")
    deductible: Percent = Decimal("100")
    vat_deductible: Percent = Decimal("100")
    paid: bool = True
    paid_date: dt.date | None = None


class RecurringIn(_In):
    """Plantilla del gasto + día del mes; `startDate` es la primera ocurrencia."""

    expense: ExpenseIn
    day: Annotated[int, Field(ge=1, le=31)]
    start_date: dt.date
    active: bool = True


class CashSettingsIn(_In):
    opening_balance: Money = Decimal("0")
    withdrawals: Money = Decimal("0")
    vat_paid: Money = Decimal("0")
    extra_irpf_used: Money = Decimal("0")


class TimesheetIn(_In):
    vacations: Annotated[list[dt.date], Field(max_length=31)] = []
    holidays: Annotated[list[dt.date], Field(max_length=31)] = []


class WealthPlanIn(_In):
    category: Literal["saving", "investment"]
    name: Annotated[str, Field(min_length=1, max_length=100)]
    start_month: str
    horizon: Annotated[int, Field(ge=1, le=600)] = 12
    annual_rate: Annotated[Decimal, Field(ge=-100, le=1000, max_digits=14, decimal_places=6)] = Decimal("0")
    initial: Money = Decimal("0")
    monthly: Money = Decimal("0")
    target: Money = Decimal("0")
    active: bool = True

    @field_validator("start_month")
    @classmethod
    def _sm(cls, v: str) -> str:
        return _month(v)


class WealthEntryIn(_In):
    action: Literal["contribution", "withdrawal", "valuation"]
    date: dt.date
    amount: Annotated[Decimal, Field(ge=0, le=MAX_AMOUNT, max_digits=14, decimal_places=2)]
    from_business: bool = False
    note: Text = ""


class SimulatorIn(_In):
    mode: Literal["percent", "amount"] = "percent"
    percent: Annotated[float, Field(ge=-100, le=1000)] = 0
    day_extra: Annotated[float, Field(ge=-100000, le=100000)] = 0
    hour_extra: Annotated[float, Field(ge=-100000, le=100000)] = 0
