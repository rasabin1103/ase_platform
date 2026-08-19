"""add source + stripe_checkout_session_id to catalog_purchases

Revision ID: f4a5b6c7d8e9
Revises: e3f4a5b6c7d8
Create Date: 2026-08-19
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "f4a5b6c7d8e9"
down_revision = "e3f4a5b6c7d8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "catalog_purchases",
        sa.Column("source", sa.String(length=32), nullable=False, server_default="free"),
    )
    op.add_column(
        "catalog_purchases",
        sa.Column("stripe_checkout_session_id", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("catalog_purchases", "stripe_checkout_session_id")
    op.drop_column("catalog_purchases", "source")
