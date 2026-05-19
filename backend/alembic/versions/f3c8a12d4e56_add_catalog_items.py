"""add catalog_items for consumer marketplace

Revision ID: f3c8a12d4e56
Revises: e2a4b8c91f03
Create Date: 2026-05-18

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "f3c8a12d4e56"
down_revision: Union[str, None] = "e2a4b8c91f03"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "catalog_items",
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column(
            "type",
            sa.Enum("product", "course", "book", "resource", name="catalog_item_type"),
            nullable=False,
        ),
        sa.Column("category", sa.String(length=120), nullable=False),
        sa.Column("short_description", sa.String(length=500), nullable=False),
        sa.Column("long_description", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(length=2048), nullable=False),
        sa.Column("price", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column(
            "status",
            sa.Enum("published", "draft", "archived", name="catalog_item_status"),
            nullable=False,
        ),
        sa.Column(
            "level",
            sa.Enum("beginner", "intermediate", "advanced", name="catalog_item_level"),
            nullable=False,
        ),
        sa.Column("duration", sa.String(length=80), nullable=True),
        sa.Column("author", sa.String(length=200), nullable=False),
        sa.Column("preview_url", sa.String(length=2048), nullable=True),
        sa.Column("benefits_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("requirements_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("included_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_catalog_items_slug"), "catalog_items", ["slug"], unique=True)
    op.create_index(op.f("ix_catalog_items_type"), "catalog_items", ["type"], unique=False)
    op.create_index(op.f("ix_catalog_items_category"), "catalog_items", ["category"], unique=False)
    op.create_index(op.f("ix_catalog_items_status"), "catalog_items", ["status"], unique=False)
    op.create_index(op.f("ix_catalog_items_uuid"), "catalog_items", ["uuid"], unique=True)


def downgrade() -> None:
    op.drop_table("catalog_items")
    op.execute("DROP TYPE IF EXISTS catalog_item_type")
    op.execute("DROP TYPE IF EXISTS catalog_item_status")
    op.execute("DROP TYPE IF EXISTS catalog_item_level")
