"""add access_requests and resource_assignments

Revision ID: d9e3f1a82b01
Revises: c7d2e8f01a99
Create Date: 2026-05-18

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "d9e3f1a82b01"
down_revision: Union[str, None] = "c7d2e8f01a99"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE role_scope ADD VALUE IF NOT EXISTS 'personal_workspace'")

    op.create_table(
        "access_requests",
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("requested_by_user_id", sa.Integer(), nullable=False),
        sa.Column("reviewed_by_user_id", sa.Integer(), nullable=True),
        sa.Column(
            "request_type",
            sa.Enum(
                "product_access",
                "course_access",
                "resource_access",
                "operational",
                name="access_request_type",
            ),
            nullable=False,
        ),
        sa.Column("target_entity_type", sa.String(length=100), nullable=False),
        sa.Column("target_entity_id", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "approved", "rejected", "cancelled", name="access_request_status"),
            nullable=False,
        ),
        sa.Column(
            "priority",
            sa.Enum("low", "normal", "high", "urgent", name="access_request_priority"),
            nullable=False,
        ),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_access_requests_organization_id"), "access_requests", ["organization_id"])
    op.create_index(op.f("ix_access_requests_requested_by_user_id"), "access_requests", ["requested_by_user_id"])
    op.create_index(op.f("ix_access_requests_reviewed_by_user_id"), "access_requests", ["reviewed_by_user_id"])
    op.create_index(op.f("ix_access_requests_request_type"), "access_requests", ["request_type"])
    op.create_index(op.f("ix_access_requests_status"), "access_requests", ["status"])
    op.create_index(op.f("ix_access_requests_target_entity_type"), "access_requests", ["target_entity_type"])
    op.create_index(op.f("ix_access_requests_target_entity_id"), "access_requests", ["target_entity_id"])
    op.create_index(op.f("ix_access_requests_uuid"), "access_requests", ["uuid"], unique=True)

    op.create_table(
        "resource_assignments",
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("resource_type", sa.String(length=100), nullable=False),
        sa.Column("resource_id", sa.String(length=64), nullable=False),
        sa.Column("assigned_to_user_id", sa.Integer(), nullable=False),
        sa.Column("assigned_by_user_id", sa.Integer(), nullable=True),
        sa.Column(
            "status",
            sa.Enum("active", "revoked", "expired", name="resource_assignment_status"),
            nullable=False,
        ),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_to_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["assigned_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_resource_assignments_organization_id"), "resource_assignments", ["organization_id"])
    op.create_index(op.f("ix_resource_assignments_resource_type"), "resource_assignments", ["resource_type"])
    op.create_index(op.f("ix_resource_assignments_resource_id"), "resource_assignments", ["resource_id"])
    op.create_index(op.f("ix_resource_assignments_assigned_to_user_id"), "resource_assignments", ["assigned_to_user_id"])
    op.create_index(op.f("ix_resource_assignments_assigned_by_user_id"), "resource_assignments", ["assigned_by_user_id"])
    op.create_index(op.f("ix_resource_assignments_status"), "resource_assignments", ["status"])


def downgrade() -> None:
    op.drop_table("resource_assignments")
    op.drop_table("access_requests")
    op.execute("DROP TYPE IF EXISTS resource_assignment_status")
    op.execute("DROP TYPE IF EXISTS access_request_status")
    op.execute("DROP TYPE IF EXISTS access_request_priority")
    op.execute("DROP TYPE IF EXISTS access_request_type")
