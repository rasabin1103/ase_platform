"""Pricing plan catalog scope and plan subscriptions."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "j5k6l7m8n9"
down_revision: Union[str, None] = "i4j5k6l7m8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "catalog_pricing_plans",
        "catalog_item_id",
        existing_type=sa.Integer(),
        nullable=True,
    )
    op.add_column(
        "catalog_pricing_plans",
        sa.Column(
            "scope_catalog_types",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
    )
    op.add_column(
        "catalog_pricing_plans",
        sa.Column(
            "scope_categories",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
    )
    op.drop_constraint("uq_catalog_pricing_plans_item_slug", "catalog_pricing_plans", type_="unique")
    op.create_index(
        "uq_catalog_pricing_plans_item_slug",
        "catalog_pricing_plans",
        ["catalog_item_id", "slug"],
        unique=True,
        postgresql_where=sa.text("catalog_item_id IS NOT NULL"),
    )
    op.create_index(
        "uq_catalog_pricing_plans_bundle_slug",
        "catalog_pricing_plans",
        ["slug"],
        unique=True,
        postgresql_where=sa.text("catalog_item_id IS NULL"),
    )
    op.create_check_constraint(
        "ck_catalog_pricing_plans_scope_or_item",
        "catalog_pricing_plans",
        "catalog_item_id IS NOT NULL OR jsonb_array_length(scope_catalog_types) > 0",
    )
    op.execute(
        """
        UPDATE catalog_pricing_plans p
        SET
          scope_catalog_types = jsonb_build_array(ci.type::text),
          scope_categories = '[]'::jsonb
        FROM catalog_items ci
        WHERE ci.id = p.catalog_item_id
          AND (p.scope_catalog_types = '[]'::jsonb OR p.scope_catalog_types IS NULL)
        """
    )
    op.create_table(
        "catalog_plan_subscriptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("catalog_pricing_plan_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["catalog_pricing_plan_id"],
            ["catalog_pricing_plans.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "catalog_pricing_plan_id", name="uq_catalog_plan_subscriptions_user_plan"),
    )
    op.create_index("ix_catalog_plan_subscriptions_plan_id", "catalog_plan_subscriptions", ["catalog_pricing_plan_id"])
    op.create_index("ix_catalog_plan_subscriptions_user_id", "catalog_plan_subscriptions", ["user_id"])


def downgrade() -> None:
    op.drop_table("catalog_plan_subscriptions")
    op.drop_constraint("ck_catalog_pricing_plans_scope_or_item", "catalog_pricing_plans", type_="check")
    op.drop_index("uq_catalog_pricing_plans_bundle_slug", table_name="catalog_pricing_plans")
    op.drop_index("uq_catalog_pricing_plans_item_slug", table_name="catalog_pricing_plans")
    op.drop_column("catalog_pricing_plans", "scope_categories")
    op.drop_column("catalog_pricing_plans", "scope_catalog_types")
    op.create_unique_constraint(
        "uq_catalog_pricing_plans_item_slug",
        "catalog_pricing_plans",
        ["catalog_item_id", "slug"],
    )
    op.alter_column(
        "catalog_pricing_plans",
        "catalog_item_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
