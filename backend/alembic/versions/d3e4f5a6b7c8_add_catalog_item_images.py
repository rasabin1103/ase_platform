"""add catalog_item_images table (multi-image gallery + cover selection)

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-08-10
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "d3e4f5a6b7c8"
down_revision = "c2d3e4f5a6b7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "catalog_item_images",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("catalog_item_id", sa.Integer(), nullable=False),
        sa.Column("image_data", postgresql.BYTEA(), nullable=True),
        sa.Column("image_mime", sa.String(length=64), nullable=True),
        sa.Column("image_url", sa.String(length=2048), nullable=True),
        sa.Column("is_cover", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["catalog_items.id"], ondelete="CASCADE"),
    )
    op.create_index(
        op.f("ix_catalog_item_images_catalog_item_id"),
        "catalog_item_images",
        ["catalog_item_id"],
    )

    # Backfill: give every existing catalog item a single cover row built from
    # its legacy image_data/image_url, so nothing regresses for items created
    # before this feature existed.
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id, image_data, image_mime, image_url FROM catalog_items")).fetchall()
    for item_id, image_data, image_mime, image_url in rows:
        if image_data:
            conn.execute(
                sa.text(
                    "INSERT INTO catalog_item_images "
                    "(catalog_item_id, image_data, image_mime, is_cover, display_order, created_at, updated_at) "
                    "VALUES (:cid, :data, :mime, true, 0, now(), now())"
                ),
                {"cid": item_id, "data": image_data, "mime": image_mime},
            )
        elif image_url:
            conn.execute(
                sa.text(
                    "INSERT INTO catalog_item_images "
                    "(catalog_item_id, image_url, is_cover, display_order, created_at, updated_at) "
                    "VALUES (:cid, :url, true, 0, now(), now())"
                ),
                {"cid": item_id, "url": image_url},
            )


def downgrade() -> None:
    op.drop_index(op.f("ix_catalog_item_images_catalog_item_id"), table_name="catalog_item_images")
    op.drop_table("catalog_item_images")
