"""add binary image storage for users and catalog

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-18

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_data", postgresql.BYTEA(), nullable=True))
    op.add_column("users", sa.Column("avatar_mime", sa.String(length=64), nullable=True))
    op.add_column("catalog_items", sa.Column("image_data", postgresql.BYTEA(), nullable=True))
    op.add_column("catalog_items", sa.Column("image_mime", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("catalog_items", "image_mime")
    op.drop_column("catalog_items", "image_data")
    op.drop_column("users", "avatar_mime")
    op.drop_column("users", "avatar_data")
