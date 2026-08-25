"""widen test_runs.github_run_id to bigint

GitHub Actions run ids have grown past 2^31 (e.g. 32863829932), which
overflowed the original plain INTEGER column. Every polling-job UPDATE for
an active run was failing with psycopg's "integer out of range" the moment
github_run_id got set, silently swallowed by the sweep job's catch-all
error handler — runs looked permanently stuck "queued"/"in_progress" in the
UI even after finishing successfully on GitHub's side.

Revision ID: 33916e8cc23b
Revises: 8345907be5b8
Create Date: 2026-08-25
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "33916e8cc23b"
down_revision = "8345907be5b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("ALTER TABLE test_runs ALTER COLUMN github_run_id TYPE BIGINT"))


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE test_runs ALTER COLUMN github_run_id TYPE INTEGER"))
