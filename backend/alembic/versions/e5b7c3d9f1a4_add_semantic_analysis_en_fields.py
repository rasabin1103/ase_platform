"""add semantic analysis en fields

Revision ID: e5b7c3d9f1a4
Revises: d2f6a9b1c3e8
Create Date: 2026-10-04

Auto-translated (DeepL) English mirrors for the AI semantic analysis
result — Groq itself replies in the posting's language, so summary/
strengths/gaps need the same ES->EN mirroring as job posting
title/description. See app/models/job_posting_semantic_analysis.py.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "e5b7c3d9f1a4"
down_revision = "d2f6a9b1c3e8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("job_posting_semantic_analyses", sa.Column("summary_en", sa.Text(), nullable=True))
    op.add_column("job_posting_semantic_analyses", sa.Column("strengths_en", postgresql.JSONB(), nullable=True))
    op.add_column("job_posting_semantic_analyses", sa.Column("gaps_en", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("job_posting_semantic_analyses", "gaps_en")
    op.drop_column("job_posting_semantic_analyses", "strengths_en")
    op.drop_column("job_posting_semantic_analyses", "summary_en")
