"""Add resource_views table

Revision ID: 7693e02ac12c
Revises: e62ff7480abe
Create Date: 2026-09-06

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "7693e02ac12c"
down_revision: Union[str, None] = "e62ff7480abe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "resource_views",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "catalog_item_id", sa.Integer(), sa.ForeignKey("catalog_items.id", ondelete="CASCADE"), nullable=False
        ),
        sa.Column("last_opened_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("open_count", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "catalog_item_id", name="uq_resource_views_user_item"),
    )
    op.create_index("ix_resource_views_user_id", "resource_views", ["user_id"])
    op.create_index("ix_resource_views_catalog_item_id", "resource_views", ["catalog_item_id"])
    op.create_index("ix_resource_views_last_opened_at", "resource_views", ["last_opened_at"])


def downgrade() -> None:
    op.drop_table("resource_views")
