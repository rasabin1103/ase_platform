"""Visor propio de cada producto probable desde ASE.

Un producto con `test_workflow_file` se ejecuta como workflow de GitHub
Actions y se ve con el visor genérico ("workflow": cuota, escenarios,
historial de ejecuciones, informe). Otros productos son herramientas que ASE
consume directamente (p. ej. una API) y traen su propia pantalla: aquí se
declara cuál. La clave (`viewer`) viaja al frontend en GET /test-execution/
frameworks y allí elige el componente (frontend/src/components/productTools).

Añadir un producto nuevo = una línea aquí + su visor en el frontend."""

from __future__ import annotations

WORKFLOW_VIEWER = "workflow"

# slug del ítem de catálogo → clave del visor
PRODUCT_VIEWERS: dict[str, str] = {
    "api-contract-guard": "contract_guard",
}


def viewer_for(slug: str) -> str:
    """Visor de un producto. Un slug registrado manda sobre el workflow."""
    return PRODUCT_VIEWERS.get(slug) or WORKFLOW_VIEWER


def registered_tool_slugs() -> list[str]:
    return list(PRODUCT_VIEWERS)
