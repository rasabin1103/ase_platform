"""MVP access requests: admin_notes, new types, user creator fields

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-05-18

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

creator_status_enum = postgresql.ENUM(
    "none",
    "pending",
    "approved",
    "rejected",
    name="creator_status",
    create_type=False,
)


def upgrade() -> None:
    op.execute("ALTER TYPE access_request_type ADD VALUE IF NOT EXISTS 'demo_access'")
    op.execute("ALTER TYPE access_request_type ADD VALUE IF NOT EXISTS 'creator_access'")

    creator_status_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "users",
        sa.Column(
            "creator_status",
            creator_status_enum,
            nullable=False,
            server_default="none",
        ),
    )
    op.add_column(
        "users",
        sa.Column("can_create_content", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("access_requests", sa.Column("admin_notes", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("access_requests", "admin_notes")
    op.drop_column("users", "can_create_content")
    op.drop_column("users", "creator_status")
    creator_status_enum.drop(op.get_bind(), checkfirst=True)
