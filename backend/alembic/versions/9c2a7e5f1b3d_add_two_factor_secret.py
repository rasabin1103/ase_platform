"""add users.two_factor_secret (TOTP)

Revision ID: 9c2a7e5f1b3d
Revises: 4e1f6c3a9b7d
Create Date: 2026-08-12
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "9c2a7e5f1b3d"
down_revision = "4e1f6c3a9b7d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("two_factor_secret", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "two_factor_secret")
