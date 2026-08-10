"""Pricing plan display columns (monthly/annual, order, popular)."""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "p1q2r3s4t5"
down_revision: Union[str, None] = "o0p1q2r3s4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("catalog_pricing_plans", sa.Column("monthly_price", sa.Numeric(12, 2), nullable=True))
    op.add_column("catalog_pricing_plans", sa.Column("annual_price", sa.Numeric(12, 2), nullable=True))
    op.add_column("catalog_pricing_plans", sa.Column("order_index", sa.Integer(), nullable=True))
    op.add_column(
        "catalog_pricing_plans",
        sa.Column("is_popular", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    op.drop_column("catalog_pricing_plans", "is_popular")
    op.drop_column("catalog_pricing_plans", "order_index")
    op.drop_column("catalog_pricing_plans", "annual_price")
    op.drop_column("catalog_pricing_plans", "monthly_price")
