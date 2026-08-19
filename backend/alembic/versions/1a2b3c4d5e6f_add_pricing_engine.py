"""add pricing engine (pillars, subcategories, dimension levels) + columns on catalog_items/services

Revision ID: 1a2b3c4d5e6f
Revises: f7a8b9c0d1e2
Create Date: 2026-08-19
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "1a2b3c4d5e6f"
down_revision = "f7a8b9c0d1e2"
branch_labels = None
depends_on = None

_PILLAR_CODE_ENUM = postgresql.ENUM(
    "product", "course", "book", "resource", "service",
    name="pricing_pillar_code",
)


def upgrade() -> None:
    _PILLAR_CODE_ENUM.create(op.get_bind(), checkfirst=True)
    pillar_code_col = postgresql.ENUM(
        "product", "course", "book", "resource", "service",
        name="pricing_pillar_code",
        create_type=False,
    )

    op.create_table(
        "pricing_pillars",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("code", pillar_code_col, nullable=False, unique=True),
        sa.Column("base_price", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_pricing_pillars_uuid", "pricing_pillars", ["uuid"])
    op.create_index("ix_pricing_pillars_code", "pricing_pillars", ["code"])

    op.create_table(
        "pricing_subcategories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("pillar_code", pillar_code_col, nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("multiplier", sa.Numeric(6, 3), nullable=False, server_default="1.000"),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_pricing_subcategories_uuid", "pricing_subcategories", ["uuid"])
    op.create_index("ix_pricing_subcategories_pillar_code", "pricing_subcategories", ["pillar_code"])
    op.create_index("ix_pricing_subcategories_display_order", "pricing_subcategories", ["display_order"])
    op.create_index("ix_pricing_subcategories_is_active", "pricing_subcategories", ["is_active"])

    op.create_table(
        "pricing_dimension_levels",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("pillar_code", pillar_code_col, nullable=False),
        sa.Column("label", sa.String(length=150), nullable=False),
        sa.Column("multiplier", sa.Numeric(6, 3), nullable=False, server_default="1.000"),
        sa.Column("min_value", sa.Integer(), nullable=True),
        sa.Column("max_value", sa.Integer(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_pricing_dimension_levels_uuid", "pricing_dimension_levels", ["uuid"])
    op.create_index("ix_pricing_dimension_levels_pillar_code", "pricing_dimension_levels", ["pillar_code"])
    op.create_index("ix_pricing_dimension_levels_display_order", "pricing_dimension_levels", ["display_order"])
    op.create_index("ix_pricing_dimension_levels_is_active", "pricing_dimension_levels", ["is_active"])

    op.add_column(
        "catalog_items",
        sa.Column("pricing_subcategory_id", sa.Integer(), sa.ForeignKey("pricing_subcategories.id", ondelete="SET NULL"), nullable=True),
    )
    op.add_column(
        "catalog_items",
        sa.Column("pricing_dimension_level_id", sa.Integer(), sa.ForeignKey("pricing_dimension_levels.id", ondelete="SET NULL"), nullable=True),
    )
    op.add_column("catalog_items", sa.Column("page_count", sa.Integer(), nullable=True))
    op.add_column("catalog_items", sa.Column("recommended_price", sa.Numeric(12, 2), nullable=True))
    op.create_index("ix_catalog_items_pricing_subcategory_id", "catalog_items", ["pricing_subcategory_id"])
    op.create_index("ix_catalog_items_pricing_dimension_level_id", "catalog_items", ["pricing_dimension_level_id"])

    op.add_column("services", sa.Column("price", sa.Numeric(12, 2), nullable=True))
    op.add_column(
        "services",
        sa.Column("pricing_subcategory_id", sa.Integer(), sa.ForeignKey("pricing_subcategories.id", ondelete="SET NULL"), nullable=True),
    )
    op.add_column(
        "services",
        sa.Column("pricing_dimension_level_id", sa.Integer(), sa.ForeignKey("pricing_dimension_levels.id", ondelete="SET NULL"), nullable=True),
    )
    op.add_column("services", sa.Column("recommended_price", sa.Numeric(12, 2), nullable=True))
    op.create_index("ix_services_pricing_subcategory_id", "services", ["pricing_subcategory_id"])
    op.create_index("ix_services_pricing_dimension_level_id", "services", ["pricing_dimension_level_id"])


def downgrade() -> None:
    op.drop_index("ix_services_pricing_dimension_level_id", table_name="services")
    op.drop_index("ix_services_pricing_subcategory_id", table_name="services")
    op.drop_column("services", "recommended_price")
    op.drop_column("services", "pricing_dimension_level_id")
    op.drop_column("services", "pricing_subcategory_id")
    op.drop_column("services", "price")

    op.drop_index("ix_catalog_items_pricing_dimension_level_id", table_name="catalog_items")
    op.drop_index("ix_catalog_items_pricing_subcategory_id", table_name="catalog_items")
    op.drop_column("catalog_items", "recommended_price")
    op.drop_column("catalog_items", "page_count")
    op.drop_column("catalog_items", "pricing_dimension_level_id")
    op.drop_column("catalog_items", "pricing_subcategory_id")

    op.drop_table("pricing_dimension_levels")
    op.drop_table("pricing_subcategories")
    op.drop_table("pricing_pillars")
    _PILLAR_CODE_ENUM.drop(op.get_bind(), checkfirst=True)
