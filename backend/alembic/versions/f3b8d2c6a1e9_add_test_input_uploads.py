"""(sustituida) los adjuntos de «file» viajan dentro del propio workflow_dispatch

Esta revisión creó test_input_uploads durante un primer diseño que luego se
descartó. Se mantiene para no romper la cadena de Alembic de quien ya la
aplicó; ahora solo elimina la tabla si existe.

Revision ID: f3b8d2c6a1e9
Revises: e8c4a1d7b3f5
Create Date: 2026-10-22
"""

from __future__ import annotations

from alembic import op

revision = "f3b8d2c6a1e9"
down_revision = "e8c4a1d7b3f5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS test_input_uploads")


def downgrade() -> None:
    pass
