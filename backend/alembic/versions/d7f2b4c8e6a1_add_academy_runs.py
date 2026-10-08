"""add academy_runs (ASE Academy saved progress)

Revision ID: d7f2b4c8e6a1
Revises: c3e9a7d1f5b2
Create Date: 2026-10-05
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d7f2b4c8e6a1"
down_revision = "c3e9a7d1f5b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "academy_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_key", sa.String(length=80), nullable=False),
        sa.Column("mission_id", sa.String(length=80), nullable=False),
        sa.Column("seed", sa.Integer(), nullable=False),
        sa.Column("actions_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("finished", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "course_key", "mission_id", name="uq_academy_runs_user_course_mission"),
    )
    op.create_index("ix_academy_runs_user_id", "academy_runs", ["user_id"])
    op.create_index("ix_academy_runs_course_key", "academy_runs", ["course_key"])


def downgrade() -> None:
    op.drop_index("ix_academy_runs_course_key", table_name="academy_runs")
    op.drop_index("ix_academy_runs_user_id", table_name="academy_runs")
    op.drop_table("academy_runs")
