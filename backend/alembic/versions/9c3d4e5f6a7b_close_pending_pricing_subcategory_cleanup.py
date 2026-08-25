"""close pending cleanup from the multi-dimension pricing migration
(2b3c4d5e6f7a) — some deployments have this migration's history recorded
in alembic_version but were missing its final cleanup statements, most
likely from a manual/partial schema change applied outside of Alembic at
some point. This re-applies exactly those closing steps: add
services.estimated_hours, drop the legacy pricing_subcategory_id columns,
and drop the now-fully-superseded pricing_subcategories table.

Every statement below is written to be a safe no-op if it was already
applied by hand (IF EXISTS / IF NOT EXISTS), so this migration is safe to
run regardless of how much of the original cleanup already landed.

Revision ID: 9c3d4e5f6a7b
Revises: 7a1b2c3d4e5f
Create Date: 2026-08-24
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "9c3d4e5f6a7b"
down_revision = "7a1b2c3d4e5f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- services.estimated_hours — drives "Horas" auto-match, mirrors
    # catalog_items.page_count for books. Added by 2b3c4d5e6f7a; re-applied
    # here defensively since some databases never got it. ------------------
    op.execute(sa.text("ALTER TABLE services ADD COLUMN IF NOT EXISTS estimated_hours INTEGER"))

    # --- Legacy pricing_subcategory_id columns — fully superseded by the
    # "subtipo" PricingDimensionLevel rows created in 2b3c4d5e6f7a. --------
    op.execute(sa.text("DROP INDEX IF EXISTS ix_catalog_items_pricing_subcategory_id"))
    op.execute(sa.text("ALTER TABLE catalog_items DROP COLUMN IF EXISTS pricing_subcategory_id"))

    op.execute(sa.text("DROP INDEX IF EXISTS ix_services_pricing_subcategory_id"))
    op.execute(sa.text("ALTER TABLE services DROP COLUMN IF EXISTS pricing_subcategory_id"))

    # --- pricing_subcategories table itself — its rows were already folded
    # into pricing_dimension_levels (code="subtipo") by 2b3c4d5e6f7a. ------
    op.execute(sa.text("DROP INDEX IF EXISTS ix_pricing_subcategories_pillar_code"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_pricing_subcategories_display_order"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_pricing_subcategories_is_active"))
    op.execute(sa.text("DROP INDEX IF EXISTS ix_pricing_subcategories_uuid"))
    op.execute(sa.text("DROP TABLE IF EXISTS pricing_subcategories"))


def downgrade() -> None:
    # Schema-only reversal — the pricing_subcategories rows were already
    # folded into pricing_dimension_levels back in 2b3c4d5e6f7a and are not
    # reconstructed here (same non-data-preserving limitation as that
    # migration's own downgrade for this exact table).
    op.execute(
        sa.text(
            """
            CREATE TABLE IF NOT EXISTS pricing_subcategories (
                id SERIAL PRIMARY KEY,
                uuid UUID NOT NULL UNIQUE,
                pillar_code pricing_pillar_code NOT NULL,
                name VARCHAR(150) NOT NULL,
                multiplier NUMERIC(6, 3) NOT NULL DEFAULT 1.000,
                display_order INTEGER NOT NULL DEFAULT 0,
                is_active BOOLEAN NOT NULL DEFAULT true,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
    )
    op.execute(sa.text("CREATE INDEX IF NOT EXISTS ix_pricing_subcategories_uuid ON pricing_subcategories (uuid)"))
    op.execute(
        sa.text(
            "CREATE INDEX IF NOT EXISTS ix_pricing_subcategories_pillar_code ON pricing_subcategories (pillar_code)"
        )
    )
    op.execute(
        sa.text(
            "CREATE INDEX IF NOT EXISTS ix_pricing_subcategories_display_order ON pricing_subcategories (display_order)"
        )
    )
    op.execute(
        sa.text("CREATE INDEX IF NOT EXISTS ix_pricing_subcategories_is_active ON pricing_subcategories (is_active)")
    )

    op.execute(
        sa.text(
            "ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS pricing_subcategory_id INTEGER "
            "REFERENCES pricing_subcategories(id) ON DELETE SET NULL"
        )
    )
    op.execute(
        sa.text(
            "CREATE INDEX IF NOT EXISTS ix_catalog_items_pricing_subcategory_id "
            "ON catalog_items (pricing_subcategory_id)"
        )
    )
    op.execute(
        sa.text(
            "ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_subcategory_id INTEGER "
            "REFERENCES pricing_subcategories(id) ON DELETE SET NULL"
        )
    )
    op.execute(
        sa.text("CREATE INDEX IF NOT EXISTS ix_services_pricing_subcategory_id ON services (pricing_subcategory_id)")
    )

    op.execute(sa.text("ALTER TABLE services DROP COLUMN IF EXISTS estimated_hours"))
