"""allow anonymous book repo redemptions (user_id nullable)

Revision ID: 3a7d5e91c2f0
Revises: 9c1f2a7e4b5d
Create Date: 2026-08-11
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "3a7d5e91c2f0"
down_revision = "9c1f2a7e4b5d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "book_repo_redemptions",
        "user_id",
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    # Anonymous rows (user_id IS NULL) would violate the restored NOT NULL
    # constraint — remove them before downgrading.
    op.execute("DELETE FROM book_repo_redemptions WHERE user_id IS NULL")
    op.alter_column(
        "book_repo_redemptions",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False,
    )
