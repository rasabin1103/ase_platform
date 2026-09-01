"""add test_quota_resets — admin-granted per-user run-quota reset

Lets an admin give a specific buyer a fresh batch of test-execution runs
(e.g. for a demo account) without hard-deleting their TestRun history —
TestExecutionService._used_runs only counts runs from at or after the most
recent reset_at for that (user, catalog_item) pair, once one exists. See
app/models/test_quota_reset.py for the full rationale.

Revision ID: f3a9c7d1e5b2
Revises: c1a8f3d29b6e
Create Date: 2026-08-26
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f3a9c7d1e5b2"
down_revision: Union[str, None] = "c1a8f3d29b6e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "test_quota_resets",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("catalog_item_id", sa.Integer(), nullable=False),
        sa.Column("reset_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["catalog_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "catalog_item_id", name="uq_test_quota_resets_user_item"),
    )
    op.create_index(
        op.f("ix_test_quota_resets_user_id"), "test_quota_resets", ["user_id"],
    )
    op.create_index(
        op.f("ix_test_quota_resets_catalog_item_id"), "test_quota_resets", ["catalog_item_id"],
    )


def downgrade() -> None:
    op.drop_table("test_quota_resets")
