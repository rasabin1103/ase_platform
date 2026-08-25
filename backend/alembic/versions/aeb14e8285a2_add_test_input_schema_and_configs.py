"""add test_input_schema_json, test_execution_configs, nullable test_runs.api_credential_id

Lets an admin declare which workflow_dispatch inputs a framework product
needs (test_input_schema_json on catalog_items), lets a buyer save their
own values for those inputs per framework (new test_execution_configs
table, values encrypted at rest — see app.core.secret_encryption), and
lets a run be triggered straight from the private dashboard with no
client_id/client_secret involved (test_runs.api_credential_id becomes
nullable).

Revision ID: aeb14e8285a2
Revises: 78c2467ccf47
Create Date: 2026-08-25
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "aeb14e8285a2"
down_revision = "78c2467ccf47"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS test_input_schema_json JSONB"))

    op.execute(sa.text("ALTER TABLE test_runs ALTER COLUMN api_credential_id DROP NOT NULL"))

    op.create_table(
        "test_execution_configs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "catalog_item_id", sa.Integer(), sa.ForeignKey("catalog_items.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("values_json", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "catalog_item_id", name="uq_test_execution_configs_user_item"),
    )
    op.create_index("ix_test_execution_configs_user_id", "test_execution_configs", ["user_id"])
    op.create_index("ix_test_execution_configs_catalog_item_id", "test_execution_configs", ["catalog_item_id"])


def downgrade() -> None:
    op.drop_index("ix_test_execution_configs_catalog_item_id", table_name="test_execution_configs")
    op.drop_index("ix_test_execution_configs_user_id", table_name="test_execution_configs")
    op.drop_table("test_execution_configs")

    # Schema-only reversal: any dashboard-triggered run (null credential)
    # created while this migration was applied would violate NOT NULL on
    # downgrade — acceptable for this project's non-data-preserving
    # downgrade convention (see other migrations' downgrade docstrings).
    op.execute(sa.text("ALTER TABLE test_runs ALTER COLUMN api_credential_id SET NOT NULL"))

    op.execute(sa.text("ALTER TABLE catalog_items DROP COLUMN IF EXISTS test_input_schema_json"))
