"""add target column to suggestions (platform vs organization)

Revision ID: f5a6b7c8d9e0
Revises: e4f5a6b7c8d9
Create Date: 2026-08-11
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "f5a6b7c8d9e0"
down_revision = "e4f5a6b7c8d9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "suggestions",
        sa.Column("target", sa.String(length=16), server_default="platform", nullable=False),
    )
    op.create_index(op.f("ix_suggestions_target"), "suggestions", ["target"])


def downgrade() -> None:
    op.drop_index(op.f("ix_suggestions_target"), table_name="suggestions")
    op.drop_column("suggestions", "target")
