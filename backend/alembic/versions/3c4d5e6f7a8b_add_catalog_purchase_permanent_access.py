"""add permanent_access_granted_at to catalog_purchases

Revision ID: 3c4d5e6f7a8b
Revises: 2b3c4d5e6f7a
Create Date: 2026-08-20

Product decision (Roberto, 2026-08-20): a direct/individual catalog
purchase grants lifetime access; plan-based access ends the moment the
organization's subscription is no longer active/trialing. This column
marks a row as permanent — NULL means the row's access is decided live,
by checking the organization's current subscription status against the
plan's included items (see CatalogPurchasesRepository.slugs_for_user()).

Backfill: every existing row was granted before this policy existed, so
we backfill as if the policy had always applied — permanent (= created_at)
for every source except "plan_entitlement", which stays NULL (live-checked
going forward). No production users exist yet, so this backfill is purely
for correctness/consistency, not to protect any real access.
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "3c4d5e6f7a8b"
down_revision = "2b3c4d5e6f7a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "catalog_purchases",
        sa.Column("permanent_access_granted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(
        """
        UPDATE catalog_purchases
        SET permanent_access_granted_at = created_at
        WHERE source <> 'plan_entitlement'
        """
    )


def downgrade() -> None:
    op.drop_column("catalog_purchases", "permanent_access_granted_at")
