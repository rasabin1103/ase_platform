"""Add plan_status enum + plans.status column

Revision ID: b1c2d3e4f5a6
Revises: a4b5c6d7e8f9
Create Date: 2026-09-04

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "a4b5c6d7e8f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    plan_status = sa.Enum("active", "coming_soon", "inactive", name="plan_status")
    plan_status.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "plans",
        sa.Column("status", plan_status, nullable=False, server_default="active"),
    )
    # Backfill from the existing is_active flag so a plan that was already
    # deactivated before this migration keeps reading as inactive (rather
    # than every plan silently becoming "active" regardless of history).
    op.execute("UPDATE plans SET status = 'inactive' WHERE is_active = false")


def downgrade() -> None:
    op.drop_column("plans", "status")
    op.execute("DROP TYPE IF EXISTS plan_status")
