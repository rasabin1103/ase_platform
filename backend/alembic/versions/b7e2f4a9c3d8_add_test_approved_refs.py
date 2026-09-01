"""add test_approved_refs — allowlist for non-default dispatch refs

Closes a gap where TestExecutionService.trigger_run passed a caller-supplied
`ref` straight through to github_client.dispatch_workflow with no
validation — needed once buyers get push access to their own branches (see
app/models/test_approved_ref.py for the full rationale). The default branch
stays always-allowed; anything else needs a row here.

Revision ID: b7e2f4a9c3d8
Revises: f3a9c7d1e5b2
Create Date: 2026-08-27
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7e2f4a9c3d8"
down_revision: Union[str, None] = "f3a9c7d1e5b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "test_approved_refs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("catalog_item_id", sa.Integer(), nullable=False),
        sa.Column("ref", sa.String(length=255), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["catalog_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "catalog_item_id", "ref", name="uq_test_approved_refs_user_item_ref"),
    )
    op.create_index(op.f("ix_test_approved_refs_user_id"), "test_approved_refs", ["user_id"])
    op.create_index(op.f("ix_test_approved_refs_catalog_item_id"), "test_approved_refs", ["catalog_item_id"])


def downgrade() -> None:
    op.drop_table("test_approved_refs")
