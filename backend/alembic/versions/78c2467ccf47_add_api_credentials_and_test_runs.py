"""add api_credentials and test_runs (test-execution SaaS)

Backs the client_id/client_secret credential management and run-tracking
for the test-execution SaaS API (see app.modules.test_execution, to
follow). api_credentials identifies a user for the machine-to-machine API;
test_runs records one GitHub Actions workflow_dispatch triggered through
it, mirroring GitHub's own run status/conclusion fields.

Revision ID: 78c2467ccf47
Revises: 633dc3cf2800
Create Date: 2026-08-24
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "78c2467ccf47"
down_revision = "633dc3cf2800"
branch_labels = None
depends_on = None


def _ensure_enum(name: str, values: tuple[str, ...]) -> None:
    labels = ", ".join(f"'{v}'" for v in values)
    op.execute(
        f"""
        DO $$ BEGIN
            CREATE TYPE {name} AS ENUM ({labels});
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )


api_credential_status = postgresql.ENUM("active", "revoked", name="api_credential_status", create_type=False)
test_run_status = postgresql.ENUM(
    "pending", "queued", "in_progress", "completed", "failed_to_dispatch",
    name="test_run_status", create_type=False,
)
test_run_conclusion = postgresql.ENUM(
    "success", "failure", "cancelled", "timed_out", "action_required", "unknown",
    name="test_run_conclusion", create_type=False,
)


def upgrade() -> None:
    _ensure_enum("api_credential_status", ("active", "revoked"))
    op.create_table(
        "api_credentials",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("client_id", sa.String(64), nullable=False, unique=True),
        sa.Column("client_secret_hash", sa.String(255), nullable=False),
        sa.Column("status", api_credential_status, nullable=False, server_default="active"),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_api_credentials_uuid", "api_credentials", ["uuid"])
    op.create_index("ix_api_credentials_user_id", "api_credentials", ["user_id"])
    op.create_index("ix_api_credentials_client_id", "api_credentials", ["client_id"])
    op.create_index("ix_api_credentials_status", "api_credentials", ["status"])

    _ensure_enum("test_run_status", ("pending", "queued", "in_progress", "completed", "failed_to_dispatch"))
    _ensure_enum("test_run_conclusion", ("success", "failure", "cancelled", "timed_out", "action_required", "unknown"))
    op.create_table(
        "test_runs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("catalog_item_id", sa.Integer(), sa.ForeignKey("catalog_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "api_credential_id", sa.Integer(), sa.ForeignKey("api_credentials.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", test_run_status, nullable=False, server_default="pending"),
        sa.Column("conclusion", test_run_conclusion, nullable=True),
        sa.Column("github_run_id", sa.Integer(), nullable=True),
        sa.Column("github_run_url", sa.String(2048), nullable=True),
        sa.Column("error_message", sa.String(1000), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_test_runs_uuid", "test_runs", ["uuid"])
    op.create_index("ix_test_runs_catalog_item_id", "test_runs", ["catalog_item_id"])
    op.create_index("ix_test_runs_api_credential_id", "test_runs", ["api_credential_id"])
    op.create_index("ix_test_runs_user_id", "test_runs", ["user_id"])
    op.create_index("ix_test_runs_status", "test_runs", ["status"])
    op.create_index("ix_test_runs_github_run_id", "test_runs", ["github_run_id"])


def downgrade() -> None:
    op.drop_index("ix_test_runs_github_run_id", table_name="test_runs")
    op.drop_index("ix_test_runs_status", table_name="test_runs")
    op.drop_index("ix_test_runs_user_id", table_name="test_runs")
    op.drop_index("ix_test_runs_api_credential_id", table_name="test_runs")
    op.drop_index("ix_test_runs_catalog_item_id", table_name="test_runs")
    op.drop_index("ix_test_runs_uuid", table_name="test_runs")
    op.drop_table("test_runs")
    op.execute("DROP TYPE IF EXISTS test_run_conclusion")
    op.execute("DROP TYPE IF EXISTS test_run_status")

    op.drop_index("ix_api_credentials_status", table_name="api_credentials")
    op.drop_index("ix_api_credentials_client_id", table_name="api_credentials")
    op.drop_index("ix_api_credentials_user_id", table_name="api_credentials")
    op.drop_index("ix_api_credentials_uuid", table_name="api_credentials")
    op.drop_table("api_credentials")
    op.execute("DROP TYPE IF EXISTS api_credential_status")
