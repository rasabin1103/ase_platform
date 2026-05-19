"""MVP: catalog favorites/purchases, status enum, included_items_json rename

Revision ID: a1b2c3d4e5f6
Revises: f3c8a12d4e56
Create Date: 2026-05-18

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f3c8a12d4e56"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE catalog_item_status ADD VALUE IF NOT EXISTS 'coming_soon'")
    op.execute("ALTER TYPE catalog_item_status ADD VALUE IF NOT EXISTS 'request_only'")
    op.execute("UPDATE catalog_items SET status = 'draft' WHERE status::text = 'archived'")

    op.alter_column("catalog_items", "included_json", new_column_name="included_items_json")

    op.create_table(
        "catalog_favorites",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("catalog_item_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["catalog_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "catalog_item_id", name="uq_catalog_favorites_user_item"),
    )
    op.create_index(op.f("ix_catalog_favorites_user_id"), "catalog_favorites", ["user_id"], unique=False)
    op.create_index(op.f("ix_catalog_favorites_catalog_item_id"), "catalog_favorites", ["catalog_item_id"], unique=False)

    op.create_table(
        "catalog_purchases",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("catalog_item_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["catalog_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "catalog_item_id", name="uq_catalog_purchases_user_item"),
    )
    op.create_index(op.f("ix_catalog_purchases_user_id"), "catalog_purchases", ["user_id"], unique=False)
    op.create_index(op.f("ix_catalog_purchases_catalog_item_id"), "catalog_purchases", ["catalog_item_id"], unique=False)


def downgrade() -> None:
    op.drop_table("catalog_purchases")
    op.drop_table("catalog_favorites")
    op.alter_column("catalog_items", "included_items_json", new_column_name="included_json")
