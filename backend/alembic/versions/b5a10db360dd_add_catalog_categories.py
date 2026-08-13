"""add catalog_categories + catalog_items.custom_fields_json

Revision ID: b5a10db360dd
Revises: f2f21006ce15
Create Date: 2026-08-13
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "b5a10db360dd"
down_revision = "f2f21006ce15"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "catalog_categories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("name", sa.String(length=120), nullable=False, unique=True),
        sa.Column("slug", sa.String(length=140), nullable=False, unique=True),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("fields_json", postgresql.JSONB(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_catalog_categories_uuid", "catalog_categories", ["uuid"])
    op.create_index("ix_catalog_categories_slug", "catalog_categories", ["slug"])
    op.create_index("ix_catalog_categories_display_order", "catalog_categories", ["display_order"])
    op.create_index("ix_catalog_categories_is_active", "catalog_categories", ["is_active"])

    op.add_column("catalog_items", sa.Column("custom_fields_json", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("catalog_items", "custom_fields_json")

    op.drop_index("ix_catalog_categories_is_active", table_name="catalog_categories")
    op.drop_index("ix_catalog_categories_display_order", table_name="catalog_categories")
    op.drop_index("ix_catalog_categories_slug", table_name="catalog_categories")
    op.drop_index("ix_catalog_categories_uuid", table_name="catalog_categories")
    op.drop_table("catalog_categories")
