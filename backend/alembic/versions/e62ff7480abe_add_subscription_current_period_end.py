"""Add subscriptions.current_period_end

Revision ID: e62ff7480abe
Revises: f9e6039d631f
Create Date: 2026-09-04

Renamed from the original "c2d3e4f5a6b7" on 2026-09-06 — that id collided
with the pre-existing c2d3e4f5a6b7_add_catalog_item_ratings.py (and its
down_revision updated to match add_plan_status.py's own rename from
"b1c2d3e4f5a6" to "f9e6039d631f"). See that file's docstring for why.
Only ids changed; behavior is unchanged.
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e62ff7480abe"
down_revision: Union[str, None] = "f9e6039d631f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "subscriptions",
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("subscriptions", "current_period_end")
