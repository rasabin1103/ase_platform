"""add catalog_items.academy_course_key (ASE Academy simulator link)

Revision ID: c3e9a7d1f5b2
Revises: b4e8a1c7d2f9
Create Date: 2026-10-05
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "c3e9a7d1f5b2"
down_revision = "b4e8a1c7d2f9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("catalog_items", sa.Column("academy_course_key", sa.String(length=80), nullable=True))
    op.create_index("ix_catalog_items_academy_course_key", "catalog_items", ["academy_course_key"])


def downgrade() -> None:
    op.drop_index("ix_catalog_items_academy_course_key", table_name="catalog_items")
    op.drop_column("catalog_items", "academy_course_key")
