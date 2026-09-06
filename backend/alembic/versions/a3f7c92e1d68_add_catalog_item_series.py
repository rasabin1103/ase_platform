"""add catalog_items.series_name / series_order

Revision ID: a3f7c92e1d68
Revises: 7693e02ac12c
Create Date: 2026-09-06
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "a3f7c92e1d68"
down_revision = "7693e02ac12c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("catalog_items", sa.Column("series_name", sa.String(length=160), nullable=True))
    op.add_column("catalog_items", sa.Column("series_order", sa.Integer(), nullable=True))
    op.create_index("ix_catalog_items_series_name", "catalog_items", ["series_name"])


def downgrade() -> None:
    op.drop_index("ix_catalog_items_series_name", table_name="catalog_items")
    op.drop_column("catalog_items", "series_order")
    op.drop_column("catalog_items", "series_name")
