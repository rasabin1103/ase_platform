"""Catalog item images and book purchase links."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "q2r3s4t5u6"
down_revision: Union[str, None] = "p1q2r3s4t5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

book_purchase_platform = sa.Enum(
    "amazon",
    "ase",
    "lulu",
    "gumroad",
    "shopify",
    "hotmart",
    "other",
    name="book_purchase_platform",
)


def upgrade() -> None:
    book_purchase_platform.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "catalog_item_images",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("catalog_item_id", sa.BigInteger(), nullable=False),
        sa.Column("image_url", sa.String(length=2048), nullable=False),
        sa.Column("alt_text", sa.String(length=500), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_primary", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["catalog_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_catalog_item_images_item_sort",
        "catalog_item_images",
        ["catalog_item_id", "sort_order", "created_at"],
    )
    op.create_table(
        "book_purchase_links",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("catalog_item_id", sa.BigInteger(), nullable=False),
        sa.Column("platform", book_purchase_platform, nullable=False),
        sa.Column("label", sa.String(length=200), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=True),
        sa.Column("price", sa.Numeric(12, 2), nullable=True),
        sa.Column("country", sa.String(length=2), nullable=True),
        sa.Column("is_primary", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["catalog_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("catalog_item_id", "platform", "url", name="uq_book_purchase_platform_url"),
    )
    op.create_index(
        "idx_book_purchase_links_item_sort",
        "book_purchase_links",
        ["catalog_item_id", "sort_order", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_book_purchase_links_item_sort", table_name="book_purchase_links")
    op.drop_table("book_purchase_links")
    op.drop_index("idx_catalog_item_images_item_sort", table_name="catalog_item_images")
    op.drop_table("catalog_item_images")
    book_purchase_platform.drop(op.get_bind(), checkfirst=True)
