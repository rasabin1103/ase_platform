"""add job_posting_semantic_analyses

Revision ID: c4d8e1f2a6b9
Revises: e1a9c4f7d3b2
Create Date: 2026-10-03

Caches the on-demand AI ("Análisis semántico") result per (user, posting)
pair — see app/models/job_posting_semantic_analysis.py. Once a user
analyzes a posting, the percentage/summary/strengths/gaps are read from
this table instead of calling Groq again.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "c4d8e1f2a6b9"
down_revision = "e1a9c4f7d3b2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "job_posting_semantic_analyses",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "job_posting_id", sa.Integer(), sa.ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("percentage", sa.Integer(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("strengths", postgresql.JSONB(), nullable=False),
        sa.Column("gaps", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "job_posting_id", name="uq_job_posting_semantic_analyses_user_posting"),
    )
    op.create_index(
        "ix_job_posting_semantic_analyses_user_id", "job_posting_semantic_analyses", ["user_id"],
    )
    op.create_index(
        "ix_job_posting_semantic_analyses_job_posting_id", "job_posting_semantic_analyses", ["job_posting_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_job_posting_semantic_analyses_job_posting_id", table_name="job_posting_semantic_analyses")
    op.drop_index("ix_job_posting_semantic_analyses_user_id", table_name="job_posting_semantic_analyses")
    op.drop_table("job_posting_semantic_analyses")
