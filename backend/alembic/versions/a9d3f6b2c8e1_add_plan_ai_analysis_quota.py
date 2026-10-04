"""add plan AI analysis quota + usage events

Revision ID: a9d3f6b2c8e1
Revises: f7c1d4e8a2b6
Create Date: 2026-10-04
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "a9d3f6b2c8e1"
down_revision = "f7c1d4e8a2b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("plans", sa.Column("monthly_ai_analysis_limit", sa.Integer(), nullable=True))
    op.create_table(
        "ai_analysis_usage_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_posting_id", sa.Integer(), sa.ForeignKey("job_postings.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_ai_analysis_usage_events_user_id", "ai_analysis_usage_events", ["user_id"])
    op.create_index("ix_ai_analysis_usage_events_created_at", "ai_analysis_usage_events", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_ai_analysis_usage_events_created_at", table_name="ai_analysis_usage_events")
    op.drop_index("ix_ai_analysis_usage_events_user_id", table_name="ai_analysis_usage_events")
    op.drop_table("ai_analysis_usage_events")
    op.drop_column("plans", "monthly_ai_analysis_limit")
