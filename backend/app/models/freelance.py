"""Gestión de autónomo/freelance dentro de ASE (portado de «Cuenta Clara»).

Todas las tablas pertenecen a un usuario de ASE (`user_id`): ninguna consulta
del módulo se hace sin ese filtro. Los importes derivados se guardan en
céntimos enteros; los porcentajes, como Numeric. Los borrados son lógicos
(`deleted_at`) para conservar la numeración de facturas y el historial."""

from __future__ import annotations

from datetime import date as date_type
from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.mixins import IdPkMixin, TimestampMixin

def _user_fk() -> ForeignKey:
    return ForeignKey("users.id", ondelete="CASCADE")


class FreelanceProfile(Base, IdPkMixin, TimestampMixin):
    """Datos fiscales del emisor. Uno por usuario."""

    __tablename__ = "freelance_profiles"

    user_id: Mapped[int] = mapped_column(_user_fk(), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    taxid: Mapped[str] = mapped_column(String(40), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    iban: Mapped[str] = mapped_column(String(60), nullable=False, default="")
    invoice_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#176b52")
    # Data URL PNG/JPEG/WebP validado (≤ 500 KB). Privado: solo se sirve a su dueño.
    logo: Mapped[str | None] = mapped_column(Text, nullable=True)


class FreelanceClient(Base, IdPkMixin, TimestampMixin):
    """Cliente DEL autónomo (no es un usuario ni un tenant de ASE)."""

    __tablename__ = "freelance_clients"

    user_id: Mapped[int] = mapped_column(_user_fk(), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    taxid: Mapped[str] = mapped_column(String(40), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    start_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    payment_rule: Mapped[str] = mapped_column(String(20), nullable=False, default="nextMonth")
    payment_days: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    # Reserva personal adicional de IRPF (% sobre la base). No es un impuesto en la factura.
    extra_irpf: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("0"))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FreelanceInvoice(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "freelance_invoices"
    __table_args__ = (UniqueConstraint("user_id", "number", name="uq_freelance_invoices_user_number"),)

    user_id: Mapped[int] = mapped_column(_user_fk(), index=True, nullable=False)
    client_id: Mapped[int] = mapped_column(ForeignKey("freelance_clients.id", ondelete="RESTRICT"), nullable=False)
    number: Mapped[str] = mapped_column(String(20), nullable=False)
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    due: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    service_month: Mapped[str | None] = mapped_column(String(7), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    vat: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    irpf: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    lines: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    base_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vat_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    irpf_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    total_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    paid_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    # Datos fiscales tal como eran al emitir: el PDF no cambia si luego se editan.
    client_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    profile_snapshot: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FreelanceRecurringRule(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "freelance_recurring_rules"

    user_id: Mapped[int] = mapped_column(_user_fk(), index=True, nullable=False)
    next_date: Mapped[date_type] = mapped_column(Date, nullable=False)
    day: Mapped[int] = mapped_column(Integer, nullable=False)
    template: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FreelanceExpense(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "freelance_expenses"
    __table_args__ = (
        # Una ocurrencia de una regla se genera una sola vez, aunque dos procesos coincidan.
        Index(
            "uq_freelance_expenses_rule_date",
            "recurring_rule_id",
            "date",
            unique=True,
            postgresql_where="recurring_rule_id IS NOT NULL",
        ),
    )

    user_id: Mapped[int] = mapped_column(_user_fk(), index=True, nullable=False)
    supplier: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    reference: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    base: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    vat: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    deductible: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    vat_deductible: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    base_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    vat_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    total_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    paid_date: Mapped[date_type | None] = mapped_column(Date, nullable=True)
    recurring_rule_id: Mapped[int | None] = mapped_column(
        ForeignKey("freelance_recurring_rules.id", ondelete="SET NULL"), nullable=True
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FreelanceCashSettings(Base, IdPkMixin, TimestampMixin):
    """Ajustes acumulados de caja. Uno por usuario."""

    __tablename__ = "freelance_cash_settings"

    user_id: Mapped[int] = mapped_column(_user_fk(), unique=True, nullable=False)
    opening_balance: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))
    withdrawals: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))
    vat_paid: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))
    extra_irpf_used: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))


class FreelanceTimesheet(Base, IdPkMixin, TimestampMixin):
    __tablename__ = "freelance_timesheets"
    __table_args__ = (UniqueConstraint("user_id", "month", name="uq_freelance_timesheets_user_month"),)

    user_id: Mapped[int] = mapped_column(_user_fk(), index=True, nullable=False)
    month: Mapped[str] = mapped_column(String(7), nullable=False)
    vacations: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    holidays: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)


class FreelanceWealthPlan(Base, IdPkMixin, TimestampMixin):
    """Plan personal de ahorro o inversión (separado de la actividad profesional)."""

    __tablename__ = "freelance_wealth_plans"

    user_id: Mapped[int] = mapped_column(_user_fk(), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(12), nullable=False)  # saving | investment
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_month: Mapped[str] = mapped_column(String(7), nullable=False)
    horizon: Mapped[int] = mapped_column(Integer, nullable=False, default=12)
    annual_rate: Mapped[Decimal] = mapped_column(Numeric(14, 6), nullable=False, default=Decimal("0"))
    initial_cents: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    monthly_cents: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    target_cents: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class FreelanceWealthEntry(Base, IdPkMixin, TimestampMixin):
    """Movimiento REAL de un plan: aportación, retirada o valoración."""

    __tablename__ = "freelance_wealth_entries"

    user_id: Mapped[int] = mapped_column(_user_fk(), index=True, nullable=False)
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("freelance_wealth_plans.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    action: Mapped[str] = mapped_column(String(16), nullable=False)  # contribution | withdrawal | valuation
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    amount_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    from_business: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    note: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
