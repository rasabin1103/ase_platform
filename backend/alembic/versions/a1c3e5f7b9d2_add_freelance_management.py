"""add freelance management tables (Cuenta Clara dentro de ASE)

Revision ID: a1c3e5f7b9d2
Revises: f3b8d2c6a1e9
Create Date: 2026-11-05
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "a1c3e5f7b9d2"
down_revision = "f3b8d2c6a1e9"
branch_labels = None
depends_on = None

_TS = lambda: [  # noqa: E731
    sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
]
_USER = lambda **kw: sa.Column(  # noqa: E731
    "user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, **kw
)


def upgrade() -> None:
    op.create_table(
        "freelance_profiles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        _USER(unique=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("taxid", sa.String(40), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("email", sa.String(200), nullable=False, server_default=""),
        sa.Column("iban", sa.String(60), nullable=False, server_default=""),
        sa.Column("invoice_color", sa.String(7), nullable=False, server_default="#176b52"),
        sa.Column("logo", sa.Text(), nullable=True),
        *_TS(),
    )
    op.create_table(
        "freelance_clients",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        _USER(index=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("taxid", sa.String(40), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("email", sa.String(200), nullable=False, server_default=""),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("payment_rule", sa.String(20), nullable=False, server_default="nextMonth"),
        sa.Column("payment_days", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("extra_irpf", sa.Numeric(5, 2), nullable=False, server_default="0"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        *_TS(),
    )
    op.create_table(
        "freelance_invoices",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        _USER(index=True),
        sa.Column("client_id", sa.Integer(), sa.ForeignKey("freelance_clients.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("number", sa.String(20), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("due", sa.Date(), nullable=True),
        sa.Column("service_month", sa.String(7), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("vat", sa.Numeric(5, 2), nullable=False),
        sa.Column("irpf", sa.Numeric(5, 2), nullable=False),
        sa.Column("lines", postgresql.JSONB(), nullable=False),
        sa.Column("base_cents", sa.BigInteger(), nullable=False),
        sa.Column("vat_cents", sa.BigInteger(), nullable=False),
        sa.Column("irpf_cents", sa.BigInteger(), nullable=False),
        sa.Column("total_cents", sa.BigInteger(), nullable=False),
        sa.Column("paid", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("paid_date", sa.Date(), nullable=True),
        sa.Column("client_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column("profile_snapshot", postgresql.JSONB(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        *_TS(),
        sa.UniqueConstraint("user_id", "number", name="uq_freelance_invoices_user_number"),
    )
    op.create_table(
        "freelance_recurring_rules",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        _USER(index=True),
        sa.Column("next_date", sa.Date(), nullable=False),
        sa.Column("day", sa.Integer(), nullable=False),
        sa.Column("template", postgresql.JSONB(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        *_TS(),
    )
    op.create_table(
        "freelance_expenses",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        _USER(index=True),
        sa.Column("supplier", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("reference", sa.String(120), nullable=False, server_default=""),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("base", sa.Numeric(14, 2), nullable=False),
        sa.Column("vat", sa.Numeric(5, 2), nullable=False),
        sa.Column("deductible", sa.Numeric(5, 2), nullable=False),
        sa.Column("vat_deductible", sa.Numeric(5, 2), nullable=False),
        sa.Column("base_cents", sa.BigInteger(), nullable=False),
        sa.Column("vat_cents", sa.BigInteger(), nullable=False),
        sa.Column("total_cents", sa.BigInteger(), nullable=False),
        sa.Column("paid", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("paid_date", sa.Date(), nullable=True),
        sa.Column(
            "recurring_rule_id",
            sa.Integer(),
            sa.ForeignKey("freelance_recurring_rules.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        *_TS(),
    )
    op.create_index(
        "uq_freelance_expenses_rule_date",
        "freelance_expenses",
        ["recurring_rule_id", "date"],
        unique=True,
        postgresql_where=sa.text("recurring_rule_id IS NOT NULL"),
    )
    op.create_table(
        "freelance_cash_settings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        _USER(unique=True),
        sa.Column("opening_balance", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("withdrawals", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("vat_paid", sa.Numeric(14, 2), nullable=False, server_default="0"),
        sa.Column("extra_irpf_used", sa.Numeric(14, 2), nullable=False, server_default="0"),
        *_TS(),
    )
    op.create_table(
        "freelance_timesheets",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        _USER(index=True),
        sa.Column("month", sa.String(7), nullable=False),
        sa.Column("vacations", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("holidays", postgresql.JSONB(), nullable=False, server_default="[]"),
        *_TS(),
        sa.UniqueConstraint("user_id", "month", name="uq_freelance_timesheets_user_month"),
    )
    op.create_table(
        "freelance_wealth_plans",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        _USER(index=True),
        sa.Column("category", sa.String(12), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("start_month", sa.String(7), nullable=False),
        sa.Column("horizon", sa.Integer(), nullable=False, server_default="12"),
        sa.Column("annual_rate", sa.Numeric(14, 6), nullable=False, server_default="0"),
        sa.Column("initial_cents", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("monthly_cents", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("target_cents", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        *_TS(),
    )
    op.create_table(
        "freelance_wealth_entries",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        _USER(index=True),
        sa.Column(
            "plan_id", sa.Integer(), sa.ForeignKey("freelance_wealth_plans.id", ondelete="RESTRICT"), nullable=False
        ),
        sa.Column("action", sa.String(16), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("amount_cents", sa.BigInteger(), nullable=False),
        sa.Column("from_business", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("note", sa.String(500), nullable=False, server_default=""),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        *_TS(),
    )
    op.create_index("ix_freelance_wealth_entries_plan_id", "freelance_wealth_entries", ["plan_id"])


def downgrade() -> None:
    for table in (
        "freelance_wealth_entries",
        "freelance_wealth_plans",
        "freelance_timesheets",
        "freelance_cash_settings",
        "freelance_expenses",
        "freelance_recurring_rules",
        "freelance_invoices",
        "freelance_clients",
        "freelance_profiles",
    ):
        op.drop_table(table)
