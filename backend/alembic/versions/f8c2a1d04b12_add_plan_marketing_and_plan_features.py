"""add plan marketing fields and plan_features

Revision ID: f8c2a1d04b12
Revises: a092a15e3706
Create Date: 2026-05-11

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f8c2a1d04b12"
down_revision: Union[str, None] = "a092a15e3706"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("plans", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("plans", sa.Column("short_description", sa.String(length=500), nullable=True))
    op.add_column(
        "plans",
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "plans",
        sa.Column("is_recommended", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column("plans", sa.Column("cta_label", sa.String(length=200), nullable=True))
    op.create_index(op.f("ix_plans_display_order"), "plans", ["display_order"], unique=False)

    op.create_table(
        "plan_features",
        sa.Column("plan_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["plan_id"], ["plans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_plan_features_plan_id"), "plan_features", ["plan_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_plan_features_plan_id"), table_name="plan_features")
    op.drop_table("plan_features")

    op.drop_index(op.f("ix_plans_display_order"), table_name="plans")
    op.drop_column("plans", "cta_label")
    op.drop_column("plans", "is_recommended")
    op.drop_column("plans", "display_order")
    op.drop_column("plans", "short_description")
    op.drop_column("plans", "description")
