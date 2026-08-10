"""add organization_catalog_items table and grant columns on catalog_purchases

Revision ID: b1c2d3e4f5a6
Revises: a7b8c9d0e1f2
Create Date: 2026-08-09

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, None] = "a7b8c9d0e1f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- catalog_purchases: track org-gifted purchases ---------------------
    op.add_column("catalog_purchases", sa.Column("granted_by_user_id", sa.Integer(), nullable=True))
    op.add_column("catalog_purchases", sa.Column("organization_id", sa.Integer(), nullable=True))
    op.create_index(
        op.f("ix_catalog_purchases_granted_by_user_id"), "catalog_purchases", ["granted_by_user_id"], unique=False
    )
    op.create_index(
        op.f("ix_catalog_purchases_organization_id"), "catalog_purchases", ["organization_id"], unique=False
    )
    op.create_foreign_key(
        "fk_catalog_purchases_granted_by_user_id_users",
        "catalog_purchases",
        "users",
        ["granted_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_catalog_purchases_organization_id_organizations",
        "catalog_purchases",
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # --- organization_catalog_items ----------------------------------------
    op.create_table(
        "organization_catalog_items",
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("catalog_item_id", sa.Integer(), nullable=False),
        sa.Column("added_by_user_id", sa.Integer(), nullable=True),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["catalog_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["added_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "catalog_item_id", name="uq_org_catalog_items_org_item"),
    )
    op.create_index(
        op.f("ix_organization_catalog_items_organization_id"),
        "organization_catalog_items",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_organization_catalog_items_catalog_item_id"),
        "organization_catalog_items",
        ["catalog_item_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_organization_catalog_items_catalog_item_id"), table_name="organization_catalog_items")
    op.drop_index(op.f("ix_organization_catalog_items_organization_id"), table_name="organization_catalog_items")
    op.drop_table("organization_catalog_items")

    op.drop_constraint(
        "fk_catalog_purchases_organization_id_organizations", "catalog_purchases", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_catalog_purchases_granted_by_user_id_users", "catalog_purchases", type_="foreignkey"
    )
    op.drop_index(op.f("ix_catalog_purchases_organization_id"), table_name="catalog_purchases")
    op.drop_index(op.f("ix_catalog_purchases_granted_by_user_id"), table_name="catalog_purchases")
    op.drop_column("catalog_purchases", "organization_id")
    op.drop_column("catalog_purchases", "granted_by_user_id")
