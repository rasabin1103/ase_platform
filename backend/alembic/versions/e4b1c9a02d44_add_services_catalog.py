"""add services catalog tables

Revision ID: e4b1c9a02d44
Revises: f8c2a1d04b12
Create Date: 2026-05-11

"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e4b1c9a02d44"
down_revision: Union[str, None] = "f8c2a1d04b12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


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


service_category = postgresql.ENUM(
    *(
        "platform_engineering",
        "qa_automation",
        "training",
        "digital_products",
        "consulting",
        "ai_automation",
        "frameworks",
    ),
    name="service_category",
    create_type=False,
)

service_kind = postgresql.ENUM(
    *("service", "product", "framework", "course", "book"),
    name="service_kind",
    create_type=False,
)

service_price_type = postgresql.ENUM(
    *("free", "fixed", "subscription", "custom"),
    name="service_price_type",
    create_type=False,
)


def upgrade() -> None:
    _ensure_enum(
        "service_category",
        (
            "platform_engineering",
            "qa_automation",
            "training",
            "digital_products",
            "consulting",
            "ai_automation",
            "frameworks",
        ),
    )
    _ensure_enum("service_kind", ("service", "product", "framework", "course", "book"))
    _ensure_enum("service_price_type", ("free", "fixed", "subscription", "custom"))

    op.create_table(
        "services",
        sa.Column("code", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("short_description", sa.String(length=500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", service_category, nullable=False),
        sa.Column("service_type", service_kind, nullable=False),
        sa.Column("price_type", service_price_type, server_default="custom", nullable=False),
        sa.Column("is_featured", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("icon", sa.String(length=64), nullable=True),
        sa.Column("hero_title", sa.String(length=300), nullable=True),
        sa.Column("hero_subtitle", sa.String(length=500), nullable=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_services_category"), "services", ["category"], unique=False)
    op.create_index(op.f("ix_services_code"), "services", ["code"], unique=True)
    op.create_index(op.f("ix_services_display_order"), "services", ["display_order"], unique=False)
    op.create_index(op.f("ix_services_is_active"), "services", ["is_active"], unique=False)
    op.create_index(op.f("ix_services_service_type"), "services", ["service_type"], unique=False)
    op.create_index(op.f("ix_services_slug"), "services", ["slug"], unique=True)
    op.create_index(op.f("ix_services_uuid"), "services", ["uuid"], unique=True)

    op.create_table(
        "service_features",
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_service_features_service_id"), "service_features", ["service_id"], unique=False)

    op.create_table(
        "service_highlights",
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("value", sa.String(length=300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("display_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_service_highlights_service_id"), "service_highlights", ["service_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_service_highlights_service_id"), table_name="service_highlights")
    op.drop_table("service_highlights")
    op.drop_index(op.f("ix_service_features_service_id"), table_name="service_features")
    op.drop_table("service_features")
    op.drop_index(op.f("ix_services_uuid"), table_name="services")
    op.drop_index(op.f("ix_services_slug"), table_name="services")
    op.drop_index(op.f("ix_services_service_type"), table_name="services")
    op.drop_index(op.f("ix_services_is_active"), table_name="services")
    op.drop_index(op.f("ix_services_display_order"), table_name="services")
    op.drop_index(op.f("ix_services_code"), table_name="services")
    op.drop_index(op.f("ix_services_category"), table_name="services")
    op.drop_table("services")

    op.execute("DROP TYPE IF EXISTS service_price_type")
    op.execute("DROP TYPE IF EXISTS service_kind")
    op.execute("DROP TYPE IF EXISTS service_category")
