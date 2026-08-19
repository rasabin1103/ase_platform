"""add country to users

Revision ID: d2e3f4a5b6c7
Revises: c1a2b3c4d5e6
Create Date: 2026-08-19
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "d2e3f4a5b6c7"
down_revision = "c1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("country", sa.String(length=2), nullable=True))
    op.create_index("ix_users_country", "users", ["country"])


def downgrade() -> None:
    op.drop_index("ix_users_country", table_name="users")
    op.drop_column("users", "country")
