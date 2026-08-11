"""add github_username to book_repo_redemptions (GitHub auto-invite)

Revision ID: 7b4c8f21d3a9
Revises: 3a7d5e91c2f0
Create Date: 2026-08-11
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "7b4c8f21d3a9"
down_revision = "3a7d5e91c2f0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "book_repo_redemptions", sa.Column("github_username", sa.String(length=100), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("book_repo_redemptions", "github_username")
