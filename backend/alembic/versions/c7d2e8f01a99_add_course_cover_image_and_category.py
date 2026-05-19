"""add course cover_image_url and category

Revision ID: c7d2e8f01a99
Revises: e4b1c9a02d44
Create Date: 2026-05-11

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7d2e8f01a99"
down_revision: Union[str, None] = "e4b1c9a02d44"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("courses", sa.Column("cover_image_url", sa.String(length=2048), nullable=True))
    op.add_column("courses", sa.Column("category", sa.String(length=80), nullable=True))


def downgrade() -> None:
    op.drop_column("courses", "category")
    op.drop_column("courses", "cover_image_url")
