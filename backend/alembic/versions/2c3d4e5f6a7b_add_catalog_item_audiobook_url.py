"""add audiobook_url to catalog_items

Revision ID: 2c3d4e5f6a7b
Revises: 1b40d2e4117a
Create Date: 2026-08-21
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "2c3d4e5f6a7b"
down_revision = "1b40d2e4117a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("catalog_items", sa.Column("audiobook_url", sa.String(length=2048), nullable=True))


def downgrade() -> None:
    op.drop_column("catalog_items", "audiobook_url")
