"""add catalog_items.getting_started

Revision ID: f3a9d6c1b872
Revises: e7b2c5f8a104
Create Date: 2026-09-06
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "f3a9d6c1b872"
down_revision = "e7b2c5f8a104"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("catalog_items", sa.Column("getting_started", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("catalog_items", "getting_started")
