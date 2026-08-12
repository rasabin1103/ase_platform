"""add users.suspended_at + users.suspension_reason

Revision ID: 0c5207f86e10
Revises: d43e05b495be
Create Date: 2026-08-12
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0c5207f86e10"
down_revision = "d43e05b495be"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("suspended_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("users", sa.Column("suspension_reason", sa.String(length=32), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "suspension_reason")
    op.drop_column("users", "suspended_at")
