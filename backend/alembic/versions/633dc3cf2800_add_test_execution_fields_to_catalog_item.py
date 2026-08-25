"""add test-execution SaaS fields to catalog_items

Adds the three columns that let a "product" catalog item represent a
runnable test-automation framework: test_repo_url (ASE's own GitHub repo
hosting the customer's framework code), test_workflow_file (the
workflow_dispatch target inside that repo), and test_included_runs (the
run quota granted per purchase/plan-inclusion). All nullable — every
existing catalog item (and every future non-runnable one) simply leaves
them unset.

Revision ID: 633dc3cf2800
Revises: 9c3d4e5f6a7b
Create Date: 2026-08-24
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "633dc3cf2800"
down_revision = "9c3d4e5f6a7b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS test_repo_url VARCHAR(2048)"))
    op.execute(sa.text("ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS test_workflow_file VARCHAR(255)"))
    op.execute(sa.text("ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS test_included_runs INTEGER"))


def downgrade() -> None:
    op.execute(sa.text("ALTER TABLE catalog_items DROP COLUMN IF EXISTS test_included_runs"))
    op.execute(sa.text("ALTER TABLE catalog_items DROP COLUMN IF EXISTS test_workflow_file"))
    op.execute(sa.text("ALTER TABLE catalog_items DROP COLUMN IF EXISTS test_repo_url"))
