"""add stripe_price_id to plans + stripe_customer_id to organizations

Revision ID: c1a2b3c4d5e6
Revises: b5a10db360dd
Create Date: 2026-08-17
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "c1a2b3c4d5e6"
down_revision = "b5a10db360dd"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("plans", sa.Column("stripe_price_id", sa.String(length=255), nullable=True))
    op.create_unique_constraint("uq_plans_stripe_price_id", "plans", ["stripe_price_id"])

    op.add_column("organizations", sa.Column("stripe_customer_id", sa.String(length=255), nullable=True))
    op.create_unique_constraint("uq_organizations_stripe_customer_id", "organizations", ["stripe_customer_id"])


def downgrade() -> None:
    op.drop_constraint("uq_organizations_stripe_customer_id", "organizations", type_="unique")
    op.drop_column("organizations", "stripe_customer_id")

    op.drop_constraint("uq_plans_stripe_price_id", "plans", type_="unique")
    op.drop_column("plans", "stripe_price_id")
