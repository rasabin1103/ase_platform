"""add download quota, loyalty grants and plan discounts (schema catch-up)

Los modelos CatalogDownloadEvent, LoyaltyRewardGrant y PlanCatalogItemDiscount
y las columnas de cuota de descargas de `plans` existían en el código pero
ninguna migración los creaba (los tests usan create_all, por eso no se notó).

La migración es idempotente: solo crea lo que falte, de modo que es segura
tanto en una base nueva como en una donde estas tablas ya se crearon a mano.

Revision ID: f6b2d9a4c8e1
Revises: e3a9c5b7d1f4
Create Date: 2026-10-08
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "f6b2d9a4c8e1"
down_revision = "e3a9c5b7d1f4"
branch_labels = None
depends_on = None


def _has_table(name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(name)


def _has_column(table: str, column: str) -> bool:
    return any(c["name"] == column for c in sa.inspect(op.get_bind()).get_columns(table))


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    ]


def upgrade() -> None:
    for column in ("monthly_download_limit", "loyalty_bonus_downloads", "loyalty_bonus_interval_months"):
        if not _has_column("plans", column):
            op.add_column("plans", sa.Column(column, sa.Integer(), nullable=True))

    if not _has_table("catalog_download_events"):
        op.create_table(
            "catalog_download_events",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column(
                "catalog_item_id",
                sa.Integer(),
                sa.ForeignKey("catalog_items.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("downloaded_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_catalog_download_events_user_id", "catalog_download_events", ["user_id"])
        op.create_index("ix_catalog_download_events_catalog_item_id", "catalog_download_events", ["catalog_item_id"])
        op.create_index("ix_catalog_download_events_downloaded_at", "catalog_download_events", ["downloaded_at"])

    if not _has_table("loyalty_reward_grants"):
        op.create_table(
            "loyalty_reward_grants",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column(
                "organization_id",
                sa.Integer(),
                sa.ForeignKey("organizations.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("plan_id", sa.Integer(), sa.ForeignKey("plans.id", ondelete="CASCADE"), nullable=False),
            sa.Column("milestone_elapsed_months", sa.Integer(), nullable=False),
            sa.Column("downloads_granted", sa.Integer(), nullable=False),
            sa.Column("downloads_consumed", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("granted_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            *_timestamps(),
            sa.UniqueConstraint(
                "organization_id", "plan_id", "milestone_elapsed_months", name="uq_loyalty_grant_milestone"
            ),
        )
        op.create_index("ix_loyalty_reward_grants_organization_id", "loyalty_reward_grants", ["organization_id"])
        op.create_index("ix_loyalty_reward_grants_plan_id", "loyalty_reward_grants", ["plan_id"])
        op.create_index("ix_loyalty_reward_grants_expires_at", "loyalty_reward_grants", ["expires_at"])

    if not _has_table("plan_catalog_item_discounts"):
        op.create_table(
            "plan_catalog_item_discounts",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("plan_id", sa.Integer(), sa.ForeignKey("plans.id", ondelete="CASCADE"), nullable=False),
            sa.Column(
                "catalog_item_id",
                sa.Integer(),
                sa.ForeignKey("catalog_items.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("discount_percent", sa.Numeric(5, 2), nullable=False),
            *_timestamps(),
            sa.UniqueConstraint("plan_id", "catalog_item_id", name="uq_plan_catalog_item_discount_pair"),
        )
        op.create_index("ix_plan_catalog_item_discounts_plan_id", "plan_catalog_item_discounts", ["plan_id"])
        op.create_index(
            "ix_plan_catalog_item_discounts_catalog_item_id", "plan_catalog_item_discounts", ["catalog_item_id"]
        )


def downgrade() -> None:
    op.drop_table("plan_catalog_item_discounts")
    op.drop_table("loyalty_reward_grants")
    op.drop_table("catalog_download_events")
    for column in ("loyalty_bonus_interval_months", "loyalty_bonus_downloads", "monthly_download_limit"):
        op.drop_column("plans", column)
