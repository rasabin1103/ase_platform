"""add catalog_items version/changelog/compatibility + license disclosure

Version metadata (current_version, version_updated_at, changelog_json,
compatibility_json) is only meaningfully editable for type=resource items
in the admin UI, but stored generically like every other per-pillar-only
column on this table. License disclosure fields
(license_scope_json/license_redistribution/license_updates_included/
license_support_included/license_refund_policy) apply to every catalog
type and are shown on the item's detail page before purchase.

Revision ID: e7b2c5f8a104
Revises: d4c8a1f6e903
Create Date: 2026-09-06
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e7b2c5f8a104"
down_revision: Union[str, None] = "d4c8a1f6e903"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("catalog_items", sa.Column("current_version", sa.String(length=40), nullable=True))
    op.add_column("catalog_items", sa.Column("version_updated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("catalog_items", sa.Column("changelog_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("catalog_items", sa.Column("compatibility_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("catalog_items", sa.Column("license_scope_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("catalog_items", sa.Column("license_redistribution", sa.String(length=30), nullable=True))
    op.add_column(
        "catalog_items",
        sa.Column("license_updates_included", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "catalog_items",
        sa.Column("license_support_included", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("catalog_items", sa.Column("license_refund_policy", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("catalog_items", "license_refund_policy")
    op.drop_column("catalog_items", "license_support_included")
    op.drop_column("catalog_items", "license_updates_included")
    op.drop_column("catalog_items", "license_redistribution")
    op.drop_column("catalog_items", "license_scope_json")
    op.drop_column("catalog_items", "compatibility_json")
    op.drop_column("catalog_items", "changelog_json")
    op.drop_column("catalog_items", "version_updated_at")
    op.drop_column("catalog_items", "current_version")
