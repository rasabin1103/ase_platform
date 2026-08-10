"""Catalog media URLs, book commerce fields, rich content

Revision ID: h3i4j5k6l8
Revises: g2h3i4j5k6l7
Create Date: 2026-05-20

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "h3i4j5k6l8"
down_revision: Union[str, None] = "g2h3i4j5k6l7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$ BEGIN
          CREATE TYPE catalog_purchase_provider AS ENUM ('internal', 'amazon', 'external', 'request_only');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    purchase_provider = postgresql.ENUM(
        "internal",
        "amazon",
        "external",
        "request_only",
        name="catalog_purchase_provider",
        create_type=False,
    )
    op.add_column("catalog_items", sa.Column("cover_image_url", sa.String(length=2048), nullable=True))
    op.add_column("catalog_items", sa.Column("thumbnail_url", sa.String(length=2048), nullable=True))
    op.add_column("catalog_items", sa.Column("amazon_url", sa.String(length=2048), nullable=True))
    op.add_column("catalog_items", sa.Column("external_purchase_url", sa.String(length=2048), nullable=True))
    op.add_column(
        "catalog_items",
        sa.Column("purchase_provider", purchase_provider, nullable=True, server_default="internal"),
    )
    op.add_column("catalog_items", sa.Column("pdf_url", sa.String(length=2048), nullable=True))
    op.add_column("catalog_items", sa.Column("preview_pdf_url", sa.String(length=2048), nullable=True))
    op.add_column("catalog_items", sa.Column("preview_pages", sa.Integer(), nullable=True))
    op.add_column("catalog_items", sa.Column("sample_download_url", sa.String(length=2048), nullable=True))
    op.add_column("catalog_items", sa.Column("rich_content_markdown", sa.Text(), nullable=True))
    op.add_column("catalog_items", sa.Column("book_format", sa.String(length=80), nullable=True))
    op.add_column("catalog_items", sa.Column("audience_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    for col in (
        "audience_json",
        "book_format",
        "rich_content_markdown",
        "sample_download_url",
        "preview_pages",
        "preview_pdf_url",
        "pdf_url",
        "purchase_provider",
        "external_purchase_url",
        "amazon_url",
        "thumbnail_url",
        "cover_image_url",
    ):
        op.drop_column("catalog_items", col)
    op.execute("DROP TYPE IF EXISTS catalog_purchase_provider")
