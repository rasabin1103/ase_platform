"""test_execution_configs become named, defaultable "scenarios"

Lets a buyer save several named sets of workflow_dispatch input values per
framework (e.g. "Staging", "Production creds") instead of just one. Adds
`name` + `is_default` + a public `uuid` to test_execution_configs, backfills
every pre-existing row as a single "Predeterminado" default scenario, and
swaps the old (user_id, catalog_item_id) unique constraint for
(user_id, catalog_item_id, name) so multiple scenarios per framework can
coexist. Also adds test_runs.test_execution_config_id so run history can
record which scenario (if any) a run's variables came from.

Revision ID: 7f2a9c4e1b3d
Revises: 33916e8cc23b
Create Date: 2026-08-25
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "7f2a9c4e1b3d"
down_revision = "33916e8cc23b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "test_execution_configs",
        sa.Column("name", sa.String(length=150), nullable=False, server_default="Predeterminado"),
    )
    op.add_column(
        "test_execution_configs",
        sa.Column("is_default", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "test_execution_configs",
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.execute(sa.text("UPDATE test_execution_configs SET uuid = gen_random_uuid() WHERE uuid IS NULL"))
    op.execute(sa.text("UPDATE test_execution_configs SET is_default = true"))
    op.alter_column("test_execution_configs", "uuid", nullable=False)
    op.create_unique_constraint("uq_test_execution_configs_uuid", "test_execution_configs", ["uuid"])
    op.create_index("ix_test_execution_configs_uuid", "test_execution_configs", ["uuid"])

    # Drop the server defaults now that backfill is done — new rows always
    # supply both columns explicitly via the ORM (TestExecutionConfig's
    # Python-side defaults), same convention as every other JSONB/bool
    # column in this codebase's migrations.
    op.alter_column("test_execution_configs", "name", server_default=None)
    op.alter_column("test_execution_configs", "is_default", server_default=None)

    op.drop_constraint("uq_test_execution_configs_user_item", "test_execution_configs", type_="unique")
    op.create_unique_constraint(
        "uq_test_execution_configs_user_item_name",
        "test_execution_configs",
        ["user_id", "catalog_item_id", "name"],
    )

    op.add_column("test_runs", sa.Column("test_execution_config_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_test_runs_test_execution_config_id",
        "test_runs",
        "test_execution_configs",
        ["test_execution_config_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_test_runs_test_execution_config_id", "test_runs", ["test_execution_config_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_test_runs_test_execution_config_id", table_name="test_runs")
    op.drop_constraint("fk_test_runs_test_execution_config_id", "test_runs", type_="foreignkey")
    op.drop_column("test_runs", "test_execution_config_id")

    op.drop_constraint("uq_test_execution_configs_user_item_name", "test_execution_configs", type_="unique")
    # Schema-only reversal: any user who saved a second scenario for the
    # same framework while this migration was applied would collide on the
    # restored (user_id, catalog_item_id) constraint — acceptable for this
    # project's non-data-preserving downgrade convention (see other
    # migrations' downgrade docstrings).
    op.create_unique_constraint(
        "uq_test_execution_configs_user_item", "test_execution_configs", ["user_id", "catalog_item_id"],
    )

    op.drop_index("ix_test_execution_configs_uuid", table_name="test_execution_configs")
    op.drop_constraint("uq_test_execution_configs_uuid", "test_execution_configs", type_="unique")
    op.drop_column("test_execution_configs", "uuid")
    op.drop_column("test_execution_configs", "is_default")
    op.drop_column("test_execution_configs", "name")
