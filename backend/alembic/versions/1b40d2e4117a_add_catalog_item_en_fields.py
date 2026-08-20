"""add catalog item english fields (title_en, short_description_en, long_description_en)

Revision ID: 1b40d2e4117a
Revises: 4d5e6f7a8b9c
Create Date: 2026-08-20

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "1b40d2e4117a"
down_revision: Union[str, None] = "4d5e6f7a8b9c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("catalog_items", sa.Column("title_en", sa.String(length=255), nullable=True))
    op.add_column("catalog_items", sa.Column("short_description_en", sa.String(length=500), nullable=True))
    op.add_column("catalog_items", sa.Column("long_description_en", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("catalog_items", "long_description_en")
    op.drop_column("catalog_items", "short_description_en")
    op.drop_column("catalog_items", "title_en")
