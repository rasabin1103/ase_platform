"""add 'deleted' value to organization_status enum

Revision ID: c7d8e9f0a1b2
Revises: b6c7d8e9f0a1
Create Date: 2026-08-18
"""
from __future__ import annotations

from alembic import op

revision = "c7d8e9f0a1b2"
down_revision = "b6c7d8e9f0a1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE organization_status ADD VALUE IF NOT EXISTS 'deleted'")


def downgrade() -> None:
    # Postgres cannot drop a single enum value without rebuilding the type
    # (and any column/table using it) — not worth the risk for a downgrade
    # path. If ever needed, recreate organization_status without 'deleted'
    # and migrate any deleted-status rows to 'suspended' first.
    pass
