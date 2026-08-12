"""add plan_catalog_items table

Revision ID: d43e05b495be
Revises: ccc72ce7942e
Create Date: 2026-08-12
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "d43e05b495be"
down_revision = "ccc72ce7942e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "plan_catalog_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("plans.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "catalog_item_id", sa.Integer(), sa.ForeignKey("catalog_items.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("plan_id", "catalog_item_id", name="uq_plan_catalog_item_pair"),
    )
    op.create_index("ix_plan_catalog_items_plan_id", "plan_catalog_items", ["plan_id"])
    op.create_index("ix_plan_catalog_items_catalog_item_id", "plan_catalog_items", ["catalog_item_id"])


def downgrade() -> None:
    op.drop_index("ix_plan_catalog_items_catalog_item_id", table_name="plan_catalog_items")
    op.drop_index("ix_plan_catalog_items_plan_id", table_name="plan_catalog_items")
    op.drop_table("plan_catalog_items")
