"""add job_posting en fields

Revision ID: d2f6a9b1c3e8
Revises: c4d8e1f2a6b9
Create Date: 2026-10-04

Auto-translated (DeepL) English mirrors for job postings, same pattern as
CatalogItem.title_en/short_description_en/long_description_en — see
app/models/job_posting.py and JobPostingAdminService._ensure_english_fields.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "d2f6a9b1c3e8"
down_revision = "c4d8e1f2a6b9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("job_postings", sa.Column("title_en", sa.String(length=255), nullable=True))
    op.add_column("job_postings", sa.Column("description_en", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("job_postings", "description_en")
    op.drop_column("job_postings", "title_en")
