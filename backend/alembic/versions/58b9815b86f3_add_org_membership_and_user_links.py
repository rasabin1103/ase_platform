"""add organization join requests, member invites, and user profile links

Revision ID: 58b9815b86f3
Revises: f5a6b7c8d9e0
Create Date: 2026-08-11
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "58b9815b86f3"
down_revision = "f5a6b7c8d9e0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enum types are created implicitly by `create_table` below (each is bound
    # to exactly one column here) — do not pre-create them manually, that
    # causes a duplicate `CREATE TYPE` and fails with DuplicateObject.
    org_join_request_status = sa.Enum(
        "pending", "approved", "rejected", "cancelled",
        name="organization_join_request_status",
    )
    org_member_invite_status = sa.Enum(
        "pending", "accepted", "declined", "cancelled",
        name="organization_member_invite_status",
    )

    op.create_table(
        "user_links",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("url", sa.String(length=2048), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_user_links_user_id"), "user_links", ["user_id"])

    op.create_table(
        "organization_join_requests",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", org_join_request_status, nullable=False, server_default="pending"),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("reviewed_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_organization_join_requests_organization_id"), "organization_join_requests", ["organization_id"])
    op.create_index(op.f("ix_organization_join_requests_user_id"), "organization_join_requests", ["user_id"])
    op.create_index(op.f("ix_organization_join_requests_status"), "organization_join_requests", ["status"])

    op.create_table(
        "organization_member_invites",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("organization_id", sa.Integer(), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invited_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("invited_by_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", org_member_invite_status, nullable=False, server_default="pending"),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_organization_member_invites_organization_id"), "organization_member_invites", ["organization_id"])
    op.create_index(op.f("ix_organization_member_invites_invited_user_id"), "organization_member_invites", ["invited_user_id"])
    op.create_index(op.f("ix_organization_member_invites_status"), "organization_member_invites", ["status"])


def downgrade() -> None:
    op.drop_index(op.f("ix_organization_member_invites_status"), table_name="organization_member_invites")
    op.drop_index(op.f("ix_organization_member_invites_invited_user_id"), table_name="organization_member_invites")
    op.drop_index(op.f("ix_organization_member_invites_organization_id"), table_name="organization_member_invites")
    op.drop_table("organization_member_invites")

    op.drop_index(op.f("ix_organization_join_requests_status"), table_name="organization_join_requests")
    op.drop_index(op.f("ix_organization_join_requests_user_id"), table_name="organization_join_requests")
    op.drop_index(op.f("ix_organization_join_requests_organization_id"), table_name="organization_join_requests")
    op.drop_table("organization_join_requests")

    op.drop_index(op.f("ix_user_links_user_id"), table_name="user_links")
    op.drop_table("user_links")

    bind = op.get_bind()
    sa.Enum(name="organization_member_invite_status").drop(bind, checkfirst=True)
    sa.Enum(name="organization_join_request_status").drop(bind, checkfirst=True)
