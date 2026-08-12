"""add catalog_items.tags_json

Revision ID: ccc72ce7942e
Revises: 0f46daad3fff
Create Date: 2026-08-12
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "ccc72ce7942e"
down_revision = "0f46daad3fff"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("catalog_items", sa.Column("tags_json", postgresql.JSONB(), nullable=True))
    # GIN index so JSONB containment lookups (tags_json @> '["skill"]') used
    # by the tag filter stay fast as the catalog grows.
    op.execute("CREATE INDEX ix_catalog_items_tags_json ON catalog_items USING gin (tags_json)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_catalog_items_tags_json")
    op.drop_column("catalog_items", "tags_json")
