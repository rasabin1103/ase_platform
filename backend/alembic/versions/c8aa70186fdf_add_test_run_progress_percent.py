"""add test_runs.progress_percent

Best-effort completion estimate for an in-flight TestRun, computed by the
polling job from the run's own GitHub Actions job/step counts (completed
steps / total steps) since GitHub's run status alone has no percentage.

Revision ID: c8aa70186fdf
Revises: aeb14e8285a2
Create Date: 2026-08-25
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "c8aa70186fdf"
down_revision = "aeb14e8285a2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("ALTER TABLE test_runs ADD COLUMN IF NOT EXISTS progress_percent INTEGER"))


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE test_runs DROP COLUMN IF EXISTS progress_percent"))
