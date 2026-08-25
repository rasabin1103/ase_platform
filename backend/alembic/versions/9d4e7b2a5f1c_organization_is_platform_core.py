"""organizations.is_platform_core — the platform's own anchor org isn't a tenant

The RBAC model assigns every role (including super_admin) through an
OrganizationMember row, so seed_demo_rbac.py fabricates an "ASE Platform"
organization purely to give the super_admin somewhere to hang its role
assignment. That row was never meant to represent a real customer/tenant
organization, but nothing distinguished it from one, so it kept polluting
every organization-facing list and count (the org list, the "Organizaciones
por tipo" dashboard chart, etc.). This adds `is_platform_core` (default
false) and flags the existing "ase-platform" row so every such place can
exclude it going forward.

Revision ID: 9d4e7b2a5f1c
Revises: 7f2a9c4e1b3d
Create Date: 2026-08-25
"""
from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "9d4e7b2a5f1c"
down_revision = "7f2a9c4e1b3d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("is_platform_core", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.alter_column("organizations", "is_platform_core", server_default=None)
    op.execute(sa.text("UPDATE organizations SET is_platform_core = true WHERE slug = 'ase-platform'"))


def downgrade() -> None:
    op.drop_column("organizations", "is_platform_core")
