"""add preferred_language to users

Revision ID: e5f6a7b8c9d1
Revises: c7d8e9f0a1b2
Create Date: 2026-08-19
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "e5f6a7b8c9d1"
down_revision = "c7d8e9f0a1b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("preferred_language", sa.String(length=2), nullable=False, server_default="es"),
    )


def downgrade() -> None:
    op.drop_column("users", "preferred_language")
