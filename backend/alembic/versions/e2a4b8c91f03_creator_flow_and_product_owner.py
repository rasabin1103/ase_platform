"""creator flow: access_request types and product owner_user_id

Revision ID: e2a4b8c91f03
Revises: d9e3f1a82b01
Create Date: 2026-05-18

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e2a4b8c91f03"
down_revision: Union[str, None] = "d9e3f1a82b01"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE access_request_type ADD VALUE IF NOT EXISTS 'creator_application'")
    op.execute("ALTER TYPE access_request_type ADD VALUE IF NOT EXISTS 'product_creator_application'")
    op.execute("ALTER TYPE access_request_type ADD VALUE IF NOT EXISTS 'course_creator_application'")

    op.add_column("products", sa.Column("owner_user_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_products_owner_user_id",
        "products",
        "users",
        ["owner_user_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_products_owner_user_id"), "products", ["owner_user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_products_owner_user_id"), table_name="products")
    op.drop_constraint("fk_products_owner_user_id", "products", type_="foreignkey")
    op.drop_column("products", "owner_user_id")
