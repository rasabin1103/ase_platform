"""Add catalog_pricing_plans for marketplace items

Revision ID: g2h3i4j5k6l7
Revises: f1a2b3c4d5e6
Create Date: 2026-05-20

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "g2h3i4j5k6l7"
down_revision: Union[str, None] = "f1a2b3c4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pricing_plan_type = postgresql.ENUM(
        "free",
        "one_time",
        "subscription",
        "lifetime",
        "request_quote",
        name="pricing_plan_type",
        create_type=False,
    )
    pricing_billing_interval = postgresql.ENUM(
        "none",
        "monthly",
        "quarterly",
        "yearly",
        name="pricing_billing_interval",
        create_type=False,
    )
    pricing_support_level = postgresql.ENUM(
        "none",
        "basic",
        "priority",
        "enterprise",
        name="pricing_support_level",
        create_type=False,
    )

    op.execute(
        """
        DO $$ BEGIN
          CREATE TYPE pricing_plan_type AS ENUM (
            'free', 'one_time', 'subscription', 'lifetime', 'request_quote'
          );
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    op.execute(
        """
        DO $$ BEGIN
          CREATE TYPE pricing_billing_interval AS ENUM ('none', 'monthly', 'quarterly', 'yearly');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    op.execute(
        """
        DO $$ BEGIN
          CREATE TYPE pricing_support_level AS ENUM ('none', 'basic', 'priority', 'enterprise');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """
    )

    op.create_table(
        "catalog_pricing_plans",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("catalog_item_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("plan_type", pricing_plan_type, nullable=False),
        sa.Column("billing_interval", pricing_billing_interval, nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="EUR"),
        sa.Column("trial_days", sa.Integer(), nullable=True),
        sa.Column("setup_fee", sa.Numeric(12, 2), nullable=True),
        sa.Column("discount_percentage", sa.Numeric(5, 2), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("max_users", sa.Integer(), nullable=True),
        sa.Column("max_downloads", sa.Integer(), nullable=True),
        sa.Column("access_duration_days", sa.Integer(), nullable=True),
        sa.Column("includes_updates", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("includes_support", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("support_level", pricing_support_level, nullable=False),
        sa.Column("features", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("limitations", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("stripe_price_id", sa.String(length=255), nullable=True),
        sa.Column("stripe_product_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("price >= 0", name="ck_catalog_pricing_plans_price_nonneg"),
        sa.CheckConstraint("setup_fee >= 0", name="ck_catalog_pricing_plans_setup_fee_nonneg"),
        sa.CheckConstraint(
            "discount_percentage >= 0 AND discount_percentage <= 100",
            name="ck_catalog_pricing_plans_discount_pct",
        ),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["catalog_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("catalog_item_id", "slug", name="uq_catalog_pricing_plans_item_slug"),
    )
    op.create_index(
        op.f("ix_catalog_pricing_plans_catalog_item_id"),
        "catalog_pricing_plans",
        ["catalog_item_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_catalog_pricing_plans_is_active"),
        "catalog_pricing_plans",
        ["is_active"],
        unique=False,
    )
    op.create_index(
        op.f("ix_catalog_pricing_plans_plan_type"),
        "catalog_pricing_plans",
        ["plan_type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("catalog_pricing_plans")
    op.execute("DROP TYPE IF EXISTS pricing_support_level")
    op.execute("DROP TYPE IF EXISTS pricing_billing_interval")
    op.execute("DROP TYPE IF EXISTS pricing_plan_type")
