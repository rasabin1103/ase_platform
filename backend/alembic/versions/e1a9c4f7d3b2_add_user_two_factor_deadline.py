"""add per-user 2FA activation deadline

Revision ID: e1a9c4f7d3b2
Revises: d8e4f0a7b2c3
Create Date: 2026-10-03

Lets an admin give one specific user a custom "you have X days to turn on
2FA" deadline when activating their account (see UsersService.activate_user
and the extended app/core/account_lifecycle.py::run_two_factor_grace_sweep),
instead of only the global settings.TWO_FACTOR_GRACE_DAYS counted from
`created_at` that already applies to everyone.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "e1a9c4f7d3b2"
down_revision = "d8e4f0a7b2c3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("two_factor_deadline_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "two_factor_deadline_at")
