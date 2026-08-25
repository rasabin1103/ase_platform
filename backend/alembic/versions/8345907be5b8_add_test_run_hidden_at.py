"""add test_runs.hidden_at

Per-user "remove from my history" soft delete for TestRun — the row itself
is never dropped (it still counts against the owner's run quota), only
excluded from TestExecutionService.list_runs going forward.

Revision ID: 8345907be5b8
Revises: c8aa70186fdf
Create Date: 2026-08-25
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "8345907be5b8"
down_revision = "c8aa70186fdf"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMPTZ"))


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE test_runs DROP COLUMN IF EXISTS hidden_at"))
