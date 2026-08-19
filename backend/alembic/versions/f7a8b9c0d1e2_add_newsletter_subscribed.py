"""add newsletter_subscribed to users and organizations

Revision ID: f7a8b9c0d1e2
Revises: e5f6a7b8c9d1
Create Date: 2026-08-19
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "f7a8b9c0d1e2"
down_revision = "e5f6a7b8c9d1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("newsletter_subscribed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "organizations",
        sa.Column("newsletter_subscribed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("organizations", "newsletter_subscribed")
    op.drop_column("users", "newsletter_subscribed")
