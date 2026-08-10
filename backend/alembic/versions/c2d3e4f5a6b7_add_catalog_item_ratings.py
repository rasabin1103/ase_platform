"""add catalog_item_ratings table (thumbs up/down + impact tags, no stars)

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-08-10
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c2d3e4f5a6b7"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "catalog_item_ratings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("catalog_item_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("is_positive", sa.Boolean(), nullable=False),
        sa.Column("tags_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["catalog_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "catalog_item_id", name="uq_catalog_item_ratings_user_item"),
    )
    op.create_index(
        op.f("ix_catalog_item_ratings_catalog_item_id"),
        "catalog_item_ratings",
        ["catalog_item_id"],
    )
    op.create_index(
        op.f("ix_catalog_item_ratings_user_id"),
        "catalog_item_ratings",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_catalog_item_ratings_user_id"), table_name="catalog_item_ratings")
    op.drop_index(op.f("ix_catalog_item_ratings_catalog_item_id"), table_name="catalog_item_ratings")
    op.drop_table("catalog_item_ratings")
