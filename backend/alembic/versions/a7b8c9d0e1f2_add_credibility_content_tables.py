"""add team_members, testimonials, case_studies (credibility content)

Revision ID: a7b8c9d0e1f2
Revises: e5f6a7b8c9d0
Create Date: 2026-08-08

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "a7b8c9d0e1f2"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- team_members ---------------------------------------------------
    op.create_table(
        "team_members",
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("role_title", sa.String(length=200), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("photo_url", sa.String(length=2048), nullable=True),
        sa.Column("linkedin_url", sa.String(length=2048), nullable=True),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_team_members_uuid"), "team_members", ["uuid"], unique=True)
    op.create_index(op.f("ix_team_members_display_order"), "team_members", ["display_order"], unique=False)
    op.create_index(op.f("ix_team_members_is_active"), "team_members", ["is_active"], unique=False)

    # --- testimonials -----------------------------------------------------
    op.create_table(
        "testimonials",
        sa.Column("author_name", sa.String(length=200), nullable=False),
        sa.Column("author_role", sa.String(length=200), nullable=True),
        sa.Column("author_company", sa.String(length=200), nullable=True),
        sa.Column("quote", sa.Text(), nullable=False),
        sa.Column("avatar_url", sa.String(length=2048), nullable=True),
        sa.Column("rating", sa.SmallInteger(), nullable=True),
        sa.Column("is_featured", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_testimonials_uuid"), "testimonials", ["uuid"], unique=True)
    op.create_index(op.f("ix_testimonials_display_order"), "testimonials", ["display_order"], unique=False)
    op.create_index(op.f("ix_testimonials_is_active"), "testimonials", ["is_active"], unique=False)

    # --- case_studies -------------------------------------------------
    op.create_table(
        "case_studies",
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("slug", sa.String(length=180), nullable=False),
        sa.Column("client_label", sa.String(length=200), nullable=False),
        sa.Column("industry", sa.String(length=120), nullable=True),
        sa.Column("summary", sa.String(length=500), nullable=False),
        sa.Column("challenge", sa.Text(), nullable=True),
        sa.Column("solution", sa.Text(), nullable=True),
        sa.Column("results_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("cover_image_url", sa.String(length=2048), nullable=True),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_case_studies_uuid"), "case_studies", ["uuid"], unique=True)
    op.create_index(op.f("ix_case_studies_slug"), "case_studies", ["slug"], unique=True)
    op.create_index(op.f("ix_case_studies_display_order"), "case_studies", ["display_order"], unique=False)
    op.create_index(op.f("ix_case_studies_is_active"), "case_studies", ["is_active"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_case_studies_is_active"), table_name="case_studies")
    op.drop_index(op.f("ix_case_studies_display_order"), table_name="case_studies")
    op.drop_index(op.f("ix_case_studies_slug"), table_name="case_studies")
    op.drop_index(op.f("ix_case_studies_uuid"), table_name="case_studies")
    op.drop_table("case_studies")

    op.drop_index(op.f("ix_testimonials_is_active"), table_name="testimonials")
    op.drop_index(op.f("ix_testimonials_display_order"), table_name="testimonials")
    op.drop_index(op.f("ix_testimonials_uuid"), table_name="testimonials")
    op.drop_table("testimonials")

    op.drop_index(op.f("ix_team_members_is_active"), table_name="team_members")
    op.drop_index(op.f("ix_team_members_display_order"), table_name="team_members")
    op.drop_index(op.f("ix_team_members_uuid"), table_name="team_members")
    op.drop_table("team_members")
