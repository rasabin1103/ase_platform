"""add english translation columns to plans

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-08-19
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "e3f4a5b6c7d8"
down_revision = "d2e3f4a5b6c7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("plans", sa.Column("name_en", sa.String(length=200), nullable=True))
    op.add_column("plans", sa.Column("short_description_en", sa.String(length=500), nullable=True))
    op.add_column("plans", sa.Column("description_en", sa.Text(), nullable=True))
    op.add_column("plans", sa.Column("cta_label_en", sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column("plans", "cta_label_en")
    op.drop_column("plans", "description_en")
    op.drop_column("plans", "short_description_en")
    op.drop_column("plans", "name_en")
