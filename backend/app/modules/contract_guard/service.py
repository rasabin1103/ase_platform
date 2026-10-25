"""Pasarela de ASE hacia Contract Guard: acceso al producto, propiedad de
proyectos y límites. La lógica de comparación y validación vive en el
servicio; aquí solo se decide QUIÉN puede pedir QUÉ."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.product_viewers import PRODUCT_VIEWERS
from app.models.catalog_item import CatalogItem
from app.models.contract_guard_project import ContractGuardProject
from app.models.enums import CatalogItemStatus
from app.models.user import User
from app.modules.auth.dependencies import is_super_admin
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository
from app.modules.contract_guard import client
from app.modules.contract_guard.client import ContractGuardError

PRODUCT_SLUG = next(slug for slug, viewer in PRODUCT_VIEWERS.items() if viewer == "contract_guard")
MAX_UPLOAD_BYTES = 2 * 1024 * 1024


def _not_found(message: str = "Not found") -> ContractGuardError:
    return ContractGuardError(404, "not_found", message)


class ContractGuardService:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    # --- acceso al producto -------------------------------------------------

    def assert_product_access(self) -> None:
        """Igual que el resto del catálogo: super admin, producto gratuito,
        compra directa o inclusión en un plan vivo. Un producto sin publicar
        solo lo ve un super admin."""
        item = self.db.execute(select(CatalogItem).where(CatalogItem.slug == PRODUCT_SLUG)).scalar_one_or_none()
        admin = is_super_admin(self.db, self.user)
        if item is None or (item.status != CatalogItemStatus.published and not admin):
            raise _not_found("Product not available")
        if admin or item.price is None or item.price <= 0:
            return
        if item.slug not in CatalogPurchasesRepository(self.db).slugs_for_user(self.user.id):
            raise ContractGuardError(403, "product_not_owned", "You do not have access to this product")

    # --- propiedad de proyectos --------------------------------------------

    def _owned_uuids(self) -> list[str]:
        stmt = (
            select(ContractGuardProject.project_uuid)
            .where(ContractGuardProject.user_id == self.user.id)
            .order_by(ContractGuardProject.id.desc())
        )
        return list(self.db.execute(stmt).scalars().all())

    def assert_project(self, project_id: UUID) -> str:
        pid = str(project_id)
        if pid not in self._owned_uuids():
            raise _not_found("Project not found")
        return pid

    def _forget(self, project_uuid: str) -> None:
        row = self.db.execute(
            select(ContractGuardProject).where(ContractGuardProject.project_uuid == project_uuid)
        ).scalar_one_or_none()
        if row is not None:
            self.db.delete(row)
            self.db.commit()

    # --- servicio -----------------------------------------------------------

    def status(self) -> dict[str, Any]:
        if not client.is_configured():
            return {"configured": False, "available": False, "engineVersion": None}
        try:
            health = client.call("GET", "/health")
        except (client.ContractGuardUnavailable, ContractGuardError):
            return {"configured": True, "available": False, "engineVersion": None}
        return {
            "configured": True,
            "available": True,
            "engineVersion": (health or {}).get("engine_version") if isinstance(health, dict) else None,
            "maxProjects": settings.CONTRACT_GUARD_MAX_PROJECTS_PER_USER,
        }

    # --- proyectos ----------------------------------------------------------

    def list_projects(self) -> list[dict]:
        projects: list[dict] = []
        for pid in self._owned_uuids():
            try:
                projects.append(client.call("GET", f"/api/v1/projects/{pid}"))
            except ContractGuardError as exc:
                if exc.status_code == 404:
                    self._forget(pid)  # borrado fuera de ASE: no dejar huérfanos
                    continue
                raise
        return projects

    def create_project(self, body: dict) -> dict:
        count = int(
            self.db.execute(
                select(func.count()).select_from(ContractGuardProject).where(ContractGuardProject.user_id == self.user.id)
            ).scalar_one()
        )
        if count >= settings.CONTRACT_GUARD_MAX_PROJECTS_PER_USER:
            raise ContractGuardError(
                409, "project_limit_reached",
                f"You can have up to {settings.CONTRACT_GUARD_MAX_PROJECTS_PER_USER} projects",
            )
        project = client.call("POST", "/api/v1/projects", json=body)
        self.db.add(ContractGuardProject(user_id=self.user.id, project_uuid=str(project["id"])))
        self.db.commit()
        return project

    def get_project(self, project_id: UUID) -> dict:
        return client.call("GET", f"/api/v1/projects/{self.assert_project(project_id)}")

    def update_project(self, project_id: UUID, body: dict) -> dict:
        return client.call("PATCH", f"/api/v1/projects/{self.assert_project(project_id)}", json=body)

    def delete_project(self, project_id: UUID, confirm_name: str) -> None:
        pid = self.assert_project(project_id)
        client.call("DELETE", f"/api/v1/projects/{pid}", params={"confirm_name": confirm_name})
        self._forget(pid)

    # --- contratos ----------------------------------------------------------

    def import_contract(self, project_id: UUID, *, version_label: str, filename: str, content: bytes) -> dict:
        pid = self.assert_project(project_id)
        return client.call(
            "POST",
            f"/api/v1/projects/{pid}/contracts",
            data={"version_label": version_label},
            files={"file": (filename, content, "application/octet-stream")},
        )

    def list_contracts(self, project_id: UUID, *, offset: int, limit: int) -> list[dict]:
        pid = self.assert_project(project_id)
        return client.call("GET", f"/api/v1/projects/{pid}/contracts", params={"offset": offset, "limit": limit})

    def get_contract(self, project_id: UUID, version_id: UUID) -> dict:
        pid = self.assert_project(project_id)
        return client.call("GET", f"/api/v1/projects/{pid}/contracts/{version_id}")

    # --- comparaciones ------------------------------------------------------

    def create_comparison(self, project_id: UUID, body: dict) -> dict:
        pid = self.assert_project(project_id)
        return client.call("POST", f"/api/v1/projects/{pid}/comparisons", json=body)

    def list_comparisons(self, project_id: UUID, *, offset: int, limit: int) -> list[dict]:
        pid = self.assert_project(project_id)
        return client.call("GET", f"/api/v1/projects/{pid}/comparisons", params={"offset": offset, "limit": limit})

    def get_comparison(self, comparison_id: UUID, *, export: bool = False) -> dict:
        """La ruta del servicio no lleva project_id: la propiedad se
        comprueba contra el proyecto que trae el propio informe."""
        suffix = "/export" if export else ""
        report = client.call("GET", f"/api/v1/comparisons/{comparison_id}{suffix}")
        owner = str(((report or {}).get("project") or {}).get("id") or (report or {}).get("project_id") or "")
        if owner not in self._owned_uuids():
            raise _not_found("Comparison not found")
        return report

    # --- validaciones (sin estado) -----------------------------------------

    def validate_response(self, project_id: UUID, version_id: UUID, body: dict) -> dict:
        pid = self.assert_project(project_id)
        return client.call("POST", f"/api/v1/projects/{pid}/contracts/{version_id}/validate-response", json=body)

    def validate_schema(self, body: dict) -> dict:
        return client.call("POST", "/api/v1/validations/schema", json=body)

    def validate_schema_files(self, *, schema: tuple[str, bytes], response: tuple[str, bytes]) -> dict:
        return client.call(
            "POST",
            "/api/v1/validations/schema/files",
            files={
                "schema_file": (schema[0], schema[1], "application/json"),
                "response_file": (response[0], response[1], "application/json"),
            },
        )
