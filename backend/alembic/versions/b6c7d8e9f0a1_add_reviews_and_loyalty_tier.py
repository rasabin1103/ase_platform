"""add star reviews (rating/comment) to catalog_item_ratings + loyalty_tier to users

Revision ID: b6c7d8e9f0a1
Revises: a5b6c7d8e9f0
Create Date: 2026-08-18
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "b6c7d8e9f0a1"
down_revision = "a5b6c7d8e9f0"
branch_labels = None
depends_on = None

loyalty_tier_enum = postgresql.ENUM(
    "silver",
    "gold",
    "platinum",
    "infinite",
    name="loyalty_tier",
    create_type=False,
)


def upgrade() -> None:
    # catalog_item_ratings: is_positive was NOT NULL (every row was a thumbs
    # vote); a row can now exist purely for a star review, so it must become
    # nullable. rating/comment are the new review half of the row.
    op.alter_column("catalog_item_ratings", "is_positive", existing_type=sa.Boolean(), nullable=True)
    op.add_column("catalog_item_ratings", sa.Column("rating", sa.SmallInteger(), nullable=True))
    op.add_column("catalog_item_ratings", sa.Column("comment", sa.Text(), nullable=True))
    op.create_check_constraint(
        "ck_catalog_item_ratings_rating_range",
        "catalog_item_ratings",
        "rating IS NULL OR rating BETWEEN 1 AND 5",
    )

    loyalty_tier_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "users",
        sa.Column("loyalty_tier", loyalty_tier_enum, nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "loyalty_tier")
    loyalty_tier_enum.drop(op.get_bind(), checkfirst=True)

    op.drop_constraint("ck_catalog_item_ratings_rating_range", "catalog_item_ratings", type_="check")
    op.drop_column("catalog_item_ratings", "comment")
    op.drop_column("catalog_item_ratings", "rating")
    op.alter_column("catalog_item_ratings", "is_positive", existing_type=sa.Boolean(), nullable=False)
