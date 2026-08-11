"""add book repo redemption (repo_url/repo_redeem_code on catalog_items, book_repo_redemptions table)

Revision ID: 9c1f2a7e4b5d
Revises: 58b9815b86f3
Create Date: 2026-08-11
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "9c1f2a7e4b5d"
down_revision = "58b9815b86f3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("catalog_items", sa.Column("repo_url", sa.String(length=2048), nullable=True))
    op.add_column("catalog_items", sa.Column("repo_redeem_code", sa.String(length=64), nullable=True))
    op.create_unique_constraint(
        "uq_catalog_items_repo_redeem_code", "catalog_items", ["repo_redeem_code"]
    )

    op.create_table(
        "book_repo_redemptions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "catalog_item_id",
            sa.Integer(),
            sa.ForeignKey("catalog_items.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "catalog_item_id", name="uq_book_repo_redemptions_user_item"),
    )
    op.create_index(op.f("ix_book_repo_redemptions_user_id"), "book_repo_redemptions", ["user_id"])
    op.create_index(
        op.f("ix_book_repo_redemptions_catalog_item_id"), "book_repo_redemptions", ["catalog_item_id"]
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_book_repo_redemptions_catalog_item_id"), table_name="book_repo_redemptions")
    op.drop_index(op.f("ix_book_repo_redemptions_user_id"), table_name="book_repo_redemptions")
    op.drop_table("book_repo_redemptions")

    op.drop_constraint("uq_catalog_items_repo_redeem_code", "catalog_items", type_="unique")
    op.drop_column("catalog_items", "repo_redeem_code")
    op.drop_column("catalog_items", "repo_url")
