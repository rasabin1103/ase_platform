"""unified pricing engine — every pillar 'subelemento' (subtipo, complejidad,
funcionalidad, mantenimiento, duración, especialización, páginas, horas...)
becomes a PricingDimensionType; drops the separate PricingSubcategory
concept entirely (folded into a "subtipo" dimension type per pillar) and
the legacy single dimension-per-item FK.

Revision ID: 2b3c4d5e6f7a
Revises: 1a2b3c4d5e6f
Create Date: 2026-08-19
"""
from __future__ import annotations

import uuid as _uuid

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "2b3c4d5e6f7a"
down_revision = "1a2b3c4d5e6f"
branch_labels = None
depends_on = None

_PILLAR_CODE_ENUM = postgresql.ENUM(
    "product", "course", "book", "resource", "service",
    name="pricing_pillar_code",
    create_type=False,
)

# Per pillar: ordered list of (code, label, is_range_based) — every entry is
# a "subelemento" that multiplies into the final price, mirroring the
# formulas the platform owner specified:
#   product  = base × subtipo × complejidad × funcionalidad × mantenimiento
#   course   = base × subtipo × complejidad × duración × especialización
#   book     = base × subtipo × páginas × especialización
#   resource = base × subtipo × complejidad × valor
#   service  = horas × tarifa/hora(=base) × complejidad × especialización
# "subtipo" (order 0) is where any pre-existing PricingSubcategory row for
# that pillar lands. The pillar's old generic single dimension (labelled
# "Complejidad" for product/course/resource/service, "Páginas" for book —
# see the pre-multi-dimension schema) lands in the matching named entry
# below. Every other entry starts empty; the admin fills in levels.
_DIMENSION_TYPES: dict[str, list[tuple[str, str, bool]]] = {
    "product": [
        ("subtipo", "Subtipo", False),
        ("complejidad", "Complejidad", False),
        ("funcionalidad", "Funcionalidad", False),
        ("mantenimiento", "Mantenimiento", False),
    ],
    "course": [
        ("subtipo", "Subtipo", False),
        ("complejidad", "Complejidad", False),
        ("duracion", "Duración", False),
        ("especializacion", "Especialización", False),
    ],
    "book": [
        ("subtipo", "Subtipo", False),
        ("paginas", "Páginas", True),
        ("especializacion", "Especialización", False),
    ],
    "resource": [
        ("subtipo", "Subtipo", False),
        ("complejidad", "Complejidad", False),
        ("valor", "Valor", False),
    ],
    "service": [
        ("subtipo", "Subtipo", False),
        ("horas", "Horas", True),
        ("complejidad", "Complejidad", False),
        ("especializacion", "Especialización", False),
    ],
}

# Which new dimension type the pillar's pre-existing generic dimension
# (the single "Complejidad"/"Páginas" PricingDimensionLevel rows, keyed by
# pillar_code in the old schema) lands in.
_LEGACY_DIMENSION_LANDING_CODE: dict[str, str] = {
    "product": "complejidad",
    "course": "complejidad",
    "book": "paginas",
    "resource": "complejidad",
    "service": "complejidad",
}


def upgrade() -> None:
    bind = op.get_bind()

    # --- pricing_dimension_types ----------------------------------------
    op.create_table(
        "pricing_dimension_types",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("pillar_code", _PILLAR_CODE_ENUM, nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=150), nullable=False),
        sa.Column("is_range_based", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("pillar_code", "code", name="uq_pricing_dimension_types_pillar_code_code"),
    )
    op.create_index("ix_pricing_dimension_types_uuid", "pricing_dimension_types", ["uuid"])
    op.create_index("ix_pricing_dimension_types_pillar_code", "pricing_dimension_types", ["pillar_code"])
    op.create_index("ix_pricing_dimension_types_display_order", "pricing_dimension_types", ["display_order"])
    op.create_index("ix_pricing_dimension_types_is_active", "pricing_dimension_types", ["is_active"])

    types_table = sa.table(
        "pricing_dimension_types",
        sa.column("id", sa.Integer()),
        sa.column("uuid", postgresql.UUID(as_uuid=True)),
        sa.column("pillar_code", _PILLAR_CODE_ENUM),
        sa.column("code", sa.String()),
        sa.column("label", sa.String()),
        sa.column("is_range_based", sa.Boolean()),
        sa.column("display_order", sa.Integer()),
    )
    type_id_by_pillar_code: dict[tuple[str, str], int] = {}
    for pillar, entries in _DIMENSION_TYPES.items():
        for order, (code, label, is_range_based) in enumerate(entries):
            result = bind.execute(
                types_table.insert()
                .values(
                    uuid=str(_uuid.uuid4()),
                    pillar_code=pillar,
                    code=code,
                    label=label,
                    is_range_based=is_range_based,
                    display_order=order,
                )
                .returning(types_table.c.id)
            )
            type_id_by_pillar_code[(pillar, code)] = result.scalar_one()

    subtipo_type_id = {pillar: type_id_by_pillar_code[(pillar, "subtipo")] for pillar in _DIMENSION_TYPES}
    legacy_landing_type_id = {
        pillar: type_id_by_pillar_code[(pillar, code)] for pillar, code in _LEGACY_DIMENSION_LANDING_CODE.items()
    }

    # --- pricing_dimension_levels: add dimension_type_id, backfill from the
    # pillar's old generic dimension, drop pillar_code -------------------
    op.add_column(
        "pricing_dimension_levels",
        sa.Column("dimension_type_id", sa.Integer(), sa.ForeignKey("pricing_dimension_types.id", ondelete="CASCADE"), nullable=True),
    )
    for pillar, type_id in legacy_landing_type_id.items():
        bind.execute(
            sa.text(
                "UPDATE pricing_dimension_levels SET dimension_type_id = :type_id "
                "WHERE pillar_code = CAST(:pillar AS pricing_pillar_code)"
            ),
            {"type_id": type_id, "pillar": pillar},
        )
    op.alter_column("pricing_dimension_levels", "dimension_type_id", nullable=False)
    op.create_index("ix_pricing_dimension_levels_dimension_type_id", "pricing_dimension_levels", ["dimension_type_id"])
    op.drop_index("ix_pricing_dimension_levels_pillar_code", table_name="pricing_dimension_levels")
    op.drop_column("pricing_dimension_levels", "pillar_code")

    # --- Fold PricingSubcategory into a "subtipo" PricingDimensionLevel per
    # pillar — each old subcategory row becomes one selectable level -----
    levels_table = sa.table(
        "pricing_dimension_levels",
        sa.column("id", sa.Integer()),
        sa.column("uuid", postgresql.UUID(as_uuid=True)),
        sa.column("dimension_type_id", sa.Integer()),
        sa.column("label", sa.String()),
        sa.column("multiplier", sa.Numeric()),
        sa.column("display_order", sa.Integer()),
        sa.column("is_active", sa.Boolean()),
    )
    subcategory_to_level_id: dict[int, int] = {}
    subcat_rows = bind.execute(
        sa.text(
            "SELECT id, pillar_code, name, multiplier, display_order, is_active FROM pricing_subcategories"
        )
    ).fetchall()
    for row in subcat_rows:
        type_id = subtipo_type_id.get(row.pillar_code)
        if type_id is None:
            continue
        result = bind.execute(
            levels_table.insert()
            .values(
                uuid=str(_uuid.uuid4()),
                dimension_type_id=type_id,
                label=row.name,
                multiplier=row.multiplier,
                display_order=row.display_order,
                is_active=row.is_active,
            )
            .returning(levels_table.c.id)
        )
        subcategory_to_level_id[row.id] = result.scalar_one()

    # --- Join tables for multi-selection ---------------------------------
    op.create_table(
        "catalog_item_dimension_selections",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("catalog_item_id", sa.Integer(), sa.ForeignKey("catalog_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dimension_type_id", sa.Integer(), sa.ForeignKey("pricing_dimension_types.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dimension_level_id", sa.Integer(), sa.ForeignKey("pricing_dimension_levels.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("catalog_item_id", "dimension_type_id", name="uq_catalog_item_dimension_type"),
    )
    op.create_index("ix_catalog_item_dimension_selections_catalog_item_id", "catalog_item_dimension_selections", ["catalog_item_id"])
    op.create_index("ix_catalog_item_dimension_selections_dimension_type_id", "catalog_item_dimension_selections", ["dimension_type_id"])
    op.create_index("ix_catalog_item_dimension_selections_dimension_level_id", "catalog_item_dimension_selections", ["dimension_level_id"])

    op.create_table(
        "service_dimension_selections",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("service_id", sa.Integer(), sa.ForeignKey("services.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dimension_type_id", sa.Integer(), sa.ForeignKey("pricing_dimension_types.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dimension_level_id", sa.Integer(), sa.ForeignKey("pricing_dimension_levels.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("service_id", "dimension_type_id", name="uq_service_dimension_type"),
    )
    op.create_index("ix_service_dimension_selections_service_id", "service_dimension_selections", ["service_id"])
    op.create_index("ix_service_dimension_selections_dimension_type_id", "service_dimension_selections", ["dimension_type_id"])
    op.create_index("ix_service_dimension_selections_dimension_level_id", "service_dimension_selections", ["dimension_level_id"])

    # --- Migrate existing single-FK selections into the join tables ------
    bind.execute(
        sa.text(
            """
            INSERT INTO catalog_item_dimension_selections (catalog_item_id, dimension_type_id, dimension_level_id)
            SELECT ci.id, pdl.dimension_type_id, pdl.id
            FROM catalog_items ci
            JOIN pricing_dimension_levels pdl ON pdl.id = ci.pricing_dimension_level_id
            WHERE ci.pricing_dimension_level_id IS NOT NULL
            """
        )
    )
    bind.execute(
        sa.text(
            """
            INSERT INTO service_dimension_selections (service_id, dimension_type_id, dimension_level_id)
            SELECT s.id, pdl.dimension_type_id, pdl.id
            FROM services s
            JOIN pricing_dimension_levels pdl ON pdl.id = s.pricing_dimension_level_id
            WHERE s.pricing_dimension_level_id IS NOT NULL
            """
        )
    )
    # Old pricing_subcategory_id pick -> a "subtipo" selection.
    for item_id, pillar_type_id in _rows_with_subcategory(bind, "catalog_items", subcategory_to_level_id):
        pillar_type_id_col, level_id = pillar_type_id
        bind.execute(
            sa.text(
                "INSERT INTO catalog_item_dimension_selections (catalog_item_id, dimension_type_id, dimension_level_id) "
                "VALUES (:item_id, :type_id, :level_id) "
                "ON CONFLICT (catalog_item_id, dimension_type_id) DO NOTHING"
            ),
            {"item_id": item_id, "type_id": pillar_type_id_col, "level_id": level_id},
        )
    for service_id, pillar_type_id in _rows_with_subcategory(bind, "services", subcategory_to_level_id):
        pillar_type_id_col, level_id = pillar_type_id
        bind.execute(
            sa.text(
                "INSERT INTO service_dimension_selections (service_id, dimension_type_id, dimension_level_id) "
                "VALUES (:service_id, :type_id, :level_id) "
                "ON CONFLICT (service_id, dimension_type_id) DO NOTHING"
            ),
            {"service_id": service_id, "type_id": pillar_type_id_col, "level_id": level_id},
        )

    # --- services.estimated_hours — drives "Horas" auto-match, mirrors
    # catalog_items.page_count for books ----------------------------------
    op.add_column("services", sa.Column("estimated_hours", sa.Integer(), nullable=True))

    # --- Drop the legacy single-dimension FK + subcategory FK columns ---
    op.drop_index("ix_catalog_items_pricing_dimension_level_id", table_name="catalog_items")
    op.drop_column("catalog_items", "pricing_dimension_level_id")
    op.drop_index("ix_catalog_items_pricing_subcategory_id", table_name="catalog_items")
    op.drop_column("catalog_items", "pricing_subcategory_id")
    op.drop_index("ix_services_pricing_dimension_level_id", table_name="services")
    op.drop_column("services", "pricing_dimension_level_id")
    op.drop_index("ix_services_pricing_subcategory_id", table_name="services")
    op.drop_column("services", "pricing_subcategory_id")

    # --- pricing_subcategories is fully superseded by "subtipo" dimension
    # levels — drop it -----------------------------------------------------
    op.drop_index("ix_pricing_subcategories_pillar_code", table_name="pricing_subcategories")
    op.drop_index("ix_pricing_subcategories_display_order", table_name="pricing_subcategories")
    op.drop_index("ix_pricing_subcategories_is_active", table_name="pricing_subcategories")
    op.drop_index("ix_pricing_subcategories_uuid", table_name="pricing_subcategories")
    op.drop_table("pricing_subcategories")


def _rows_with_subcategory(bind, table: str, subcategory_to_level_id: dict[int, int]):
    """Yields (row_id, (dimension_type_id, migrated_level_id)) for every row
    in `table` whose old pricing_subcategory_id maps to a migrated level."""
    rows = bind.execute(
        sa.text(f"SELECT id AS row_id, pricing_subcategory_id FROM {table} WHERE pricing_subcategory_id IS NOT NULL")
    )
    for row in rows.fetchall():
        level_id = subcategory_to_level_id.get(row.pricing_subcategory_id)
        if level_id is None:
            continue
        pillar_row = bind.execute(
            sa.text("SELECT dimension_type_id FROM pricing_dimension_levels WHERE id = :level_id"),
            {"level_id": level_id},
        ).scalar_one_or_none()
        if pillar_row is None:
            continue
        yield row.row_id, (pillar_row, level_id)


def downgrade() -> None:
    bind = op.get_bind()

    # --- Recreate pricing_subcategories, fed back from "subtipo" levels --
    op.create_table(
        "pricing_subcategories",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("uuid", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("pillar_code", _PILLAR_CODE_ENUM, nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("multiplier", sa.Numeric(6, 3), nullable=False, server_default="1.000"),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_pricing_subcategories_uuid", "pricing_subcategories", ["uuid"])
    op.create_index("ix_pricing_subcategories_pillar_code", "pricing_subcategories", ["pillar_code"])
    op.create_index("ix_pricing_subcategories_display_order", "pricing_subcategories", ["display_order"])
    op.create_index("ix_pricing_subcategories_is_active", "pricing_subcategories", ["is_active"])
    bind.execute(
        sa.text(
            """
            INSERT INTO pricing_subcategories (uuid, pillar_code, name, multiplier, display_order, is_active)
            SELECT gen_random_uuid(), pdt.pillar_code, pdl.label, pdl.multiplier, pdl.display_order, pdl.is_active
            FROM pricing_dimension_levels pdl
            JOIN pricing_dimension_types pdt ON pdt.id = pdl.dimension_type_id
            WHERE pdt.code = 'subtipo'
            """
        )
    )

    op.add_column(
        "catalog_items",
        sa.Column("pricing_subcategory_id", sa.Integer(), sa.ForeignKey("pricing_subcategories.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_catalog_items_pricing_subcategory_id", "catalog_items", ["pricing_subcategory_id"])
    op.add_column(
        "catalog_items",
        sa.Column("pricing_dimension_level_id", sa.Integer(), sa.ForeignKey("pricing_dimension_levels.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_catalog_items_pricing_dimension_level_id", "catalog_items", ["pricing_dimension_level_id"])
    op.add_column(
        "services",
        sa.Column("pricing_subcategory_id", sa.Integer(), sa.ForeignKey("pricing_subcategories.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_services_pricing_subcategory_id", "services", ["pricing_subcategory_id"])
    op.add_column(
        "services",
        sa.Column("pricing_dimension_level_id", sa.Integer(), sa.ForeignKey("pricing_dimension_levels.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_services_pricing_dimension_level_id", "services", ["pricing_dimension_level_id"])

    # Best-effort backfill: pick one non-subtipo selection as the legacy
    # single dimension, and one subtipo selection as the legacy
    # subcategory (an item may now have several of each — downgrading
    # necessarily loses the rest).
    bind.execute(
        sa.text(
            """
            UPDATE catalog_items ci
            SET pricing_dimension_level_id = sub.dimension_level_id
            FROM (
                SELECT DISTINCT ON (cids.catalog_item_id) cids.catalog_item_id, cids.dimension_level_id
                FROM catalog_item_dimension_selections cids
                JOIN pricing_dimension_types pdt ON pdt.id = cids.dimension_type_id
                WHERE pdt.code != 'subtipo'
                ORDER BY cids.catalog_item_id, cids.dimension_type_id
            ) sub
            WHERE ci.id = sub.catalog_item_id
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE catalog_items ci
            SET pricing_subcategory_id = ps.id
            FROM catalog_item_dimension_selections cids
            JOIN pricing_dimension_types pdt ON pdt.id = cids.dimension_type_id AND pdt.code = 'subtipo'
            JOIN pricing_dimension_levels pdl ON pdl.id = cids.dimension_level_id
            JOIN pricing_subcategories ps ON ps.pillar_code = pdt.pillar_code AND ps.name = pdl.label
            WHERE ci.id = cids.catalog_item_id
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE services s
            SET pricing_dimension_level_id = sub.dimension_level_id
            FROM (
                SELECT DISTINCT ON (sds.service_id) sds.service_id, sds.dimension_level_id
                FROM service_dimension_selections sds
                JOIN pricing_dimension_types pdt ON pdt.id = sds.dimension_type_id
                WHERE pdt.code != 'subtipo'
                ORDER BY sds.service_id, sds.dimension_type_id
            ) sub
            WHERE s.id = sub.service_id
            """
        )
    )
    bind.execute(
        sa.text(
            """
            UPDATE services s
            SET pricing_subcategory_id = ps.id
            FROM service_dimension_selections sds
            JOIN pricing_dimension_types pdt ON pdt.id = sds.dimension_type_id AND pdt.code = 'subtipo'
            JOIN pricing_dimension_levels pdl ON pdl.id = sds.dimension_level_id
            JOIN pricing_subcategories ps ON ps.pillar_code = pdt.pillar_code AND ps.name = pdl.label
            WHERE s.id = sds.service_id
            """
        )
    )

    op.drop_column("services", "estimated_hours")

    op.drop_table("service_dimension_selections")
    op.drop_table("catalog_item_dimension_selections")

    op.add_column("pricing_dimension_levels", sa.Column("pillar_code", _PILLAR_CODE_ENUM, nullable=True))
    bind.execute(
        sa.text(
            """
            UPDATE pricing_dimension_levels pdl
            SET pillar_code = pdt.pillar_code
            FROM pricing_dimension_types pdt
            WHERE pdt.id = pdl.dimension_type_id
            """
        )
    )
    op.alter_column("pricing_dimension_levels", "pillar_code", nullable=False)
    op.create_index("ix_pricing_dimension_levels_pillar_code", "pricing_dimension_levels", ["pillar_code"])
    op.drop_index("ix_pricing_dimension_levels_dimension_type_id", table_name="pricing_dimension_levels")
    op.drop_column("pricing_dimension_levels", "dimension_type_id")

    # Drop the "subtipo" levels themselves — they're now duplicated as
    # pricing_subcategories rows above.
    bind.execute(
        sa.text(
            """
            DELETE FROM pricing_dimension_levels pdl
            USING pricing_dimension_types pdt
            WHERE pdt.id = pdl.dimension_type_id AND pdt.code = 'subtipo'
            """
        )
    )

    op.drop_index("ix_pricing_dimension_types_is_active", table_name="pricing_dimension_types")
    op.drop_index("ix_pricing_dimension_types_display_order", table_name="pricing_dimension_types")
    op.drop_index("ix_pricing_dimension_types_pillar_code", table_name="pricing_dimension_types")
    op.drop_index("ix_pricing_dimension_types_uuid", table_name="pricing_dimension_types")
    op.drop_table("pricing_dimension_types")
