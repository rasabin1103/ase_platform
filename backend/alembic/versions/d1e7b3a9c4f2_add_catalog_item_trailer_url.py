"""add catalog_items.trailer_url (tráiler opcional del ítem)

Revision ID: d1e7b3a9c4f2
Revises: a7d3e9f1c5b2
Create Date: 2026-10-19
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "d1e7b3a9c4f2"
down_revision = "a7d3e9f1c5b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("catalog_items", sa.Column("trailer_url", sa.String(length=2048), nullable=True))


def downgrade() -> None:
    op.drop_column("catalog_items", "trailer_url")
