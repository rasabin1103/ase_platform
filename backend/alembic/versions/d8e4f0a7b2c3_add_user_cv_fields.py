"""add user cv fields (job-postings compatibility analyzer)

Revision ID: d8e4f0a7b2c3
Revises: b3f7a2c9d1e6
Create Date: 2026-10-02

Adds CV storage to `users`, same in-row binary pattern as avatar_data/
avatar_mime — see app/models/user.py. cv_text caches the extracted plain
text so the keyword-based compatibility score (app/core/cv_matching.py)
doesn't re-parse the PDF/DOCX on every job-postings list request.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "d8e4f0a7b2c3"
down_revision = "b3f7a2c9d1e6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("cv_data", sa.LargeBinary(), nullable=True))
    op.add_column("users", sa.Column("cv_mime", sa.String(length=64), nullable=True))
    op.add_column("users", sa.Column("cv_filename", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("cv_text", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("cv_uploaded_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "cv_uploaded_at")
    op.drop_column("users", "cv_text")
    op.drop_column("users", "cv_filename")
    op.drop_column("users", "cv_mime")
    op.drop_column("users", "cv_data")
