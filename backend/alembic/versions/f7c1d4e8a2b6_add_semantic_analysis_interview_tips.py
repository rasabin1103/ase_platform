"""add semantic analysis interview tips

Revision ID: f7c1d4e8a2b6
Revises: e5b7c3d9f1a4
Create Date: 2026-10-04

Five tailored interview-preparation suggestions returned by the AI
semantic analysis (+ DeepL English mirror). Nullable: rows saved before
this feature simply have none.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "f7c1d4e8a2b6"
down_revision = "e5b7c3d9f1a4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("job_posting_semantic_analyses", sa.Column("interview_tips", postgresql.JSONB(), nullable=True))
    op.add_column("job_posting_semantic_analyses", sa.Column("interview_tips_en", postgresql.JSONB(), nullable=True))


def downgrade() -> None:
    op.drop_column("job_posting_semantic_analyses", "interview_tips_en")
    op.drop_column("job_posting_semantic_analyses", "interview_tips")
