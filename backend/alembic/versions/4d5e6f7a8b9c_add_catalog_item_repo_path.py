"""add repo_path to catalog_items

Revision ID: 4d5e6f7a8b9c
Revises: 3c4d5e6f7a8b
Create Date: 2026-08-20

Path to this item's specific file inside the repo at repo_url (resources —
scripts — living in the single shared ASE-Catalog repo, organized by
subtype folders). Powers the in-platform read-only viewer + download,
gated by ownership.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "4d5e6f7a8b9c"
down_revision = "3c4d5e6f7a8b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "catalog_items",
        sa.Column("repo_path", sa.String(length=1024), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("catalog_items", "repo_path")
