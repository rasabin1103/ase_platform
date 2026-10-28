"""Pasarela de ASE hacia ASE API Contract Guard.

El servicio real no se llama nunca: `client.call` se sustituye por un doble
que registra las peticiones. Se comprueba lo que es responsabilidad de ASE:
acceso al producto, propiedad de proyectos, límite por usuario, no filtrar
informes ajenos y el formato de errores."""

from __future__ import annotations

import uuid
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.product_viewers import viewer_for
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemStatus, CatalogItemType, OrganizationType, RoleScope
from app.models.user import User
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository
from app.modules.contract_guard import client as cg_client
from app.modules.contract_guard.client import ContractGuardError, ContractGuardUnavailable

from .conftest import auth_headers, make_user_with_role

BASE = "/api/v1/product-tools/contract-guard"
SLUG = "api-contract-guard"


class FakeUpstream:
    """Servicio simulado en memoria: proyectos e informes mínimos."""

    def __init__(self) -> None:
        self.calls: list[tuple[str, str]] = []
        self.projects: dict[str, dict] = {}
        self.comparisons: dict[str, dict] = {}
        self.fail_with: Exception | None = None

    def __call__(self, method, path, *, params=None, json=None, data=None, files=None):
        self.calls.append((method, path))
        if self.fail_with is not None:
            raise self.fail_with
        if method == "GET" and path == "/health":
            return {"status": "ok", "engine_version": "1.34.0"}
        if method == "POST" and path == "/api/v1/projects":
            pid = str(uuid.uuid4())
            self.projects[pid] = {"id": pid, "name": json["name"], "description": json.get("description", "")}
            return self.projects[pid]
        if path.startswith("/api/v1/projects/"):
            pid = path.split("/")[4]
            if pid not in self.projects:
                raise ContractGuardError(404, "not_found", "Project not found")
            if method == "GET" and path == f"/api/v1/projects/{pid}":
                return self.projects[pid]
            if method == "DELETE":
                if params["confirm_name"] != self.projects[pid]["name"]:
                    raise ContractGuardError(409, "confirmation_required", "Name does not match")
                del self.projects[pid]
                return None
            if method == "POST" and path.endswith("/comparisons"):
                cid = str(uuid.uuid4())
                self.comparisons[cid] = {
                    "id": cid, "project": self.projects[pid], "overall_result": "compatible",
                    "summary": {"breaking": 0, "potentially_breaking": 0, "non_breaking": 0, "informational": 0, "total": 0},
                    "findings": [],
                }
                return self.comparisons[cid]
        if method == "GET" and path.startswith("/api/v1/comparisons/"):
            cid = path.split("/")[4]
            if cid not in self.comparisons:
                raise ContractGuardError(404, "not_found", "Comparison not found")
            return self.comparisons[cid]
        if method == "POST" and path == "/api/v1/validations/schema":
            return {"valid": True, "error_count": 0, "truncated": False, "validation_scope": "json_body", "errors": [], "warnings": []}
        raise AssertionError(f"unexpected upstream call {method} {path}")


@pytest.fixture()
def upstream(monkeypatch) -> FakeUpstream:
    fake = FakeUpstream()
    monkeypatch.setattr(cg_client, "call", fake)
    monkeypatch.setattr(settings, "CONTRACT_GUARD_BASE_URL", "http://contract-guard.test")
    return fake


@pytest.fixture()
def product(db: Session) -> CatalogItem:
    item = CatalogItem(
        title="ASE API Contract Guard", slug=SLUG, type=CatalogItemType.product, category="General",
        short_description="x", long_description="x", image_url="https://example.com/i.png",
        price=Decimal("9.99"), currency="EUR", status=CatalogItemStatus.published, level="intermediate", author="ASE",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@pytest.fixture()
def buyer(db: Session, independent_user: User, product: CatalogItem) -> User:
    CatalogPurchasesRepository(db).add(independent_user.id, product.id, organization_id=None, source="free")
    db.commit()
    return independent_user


def test_viewer_registry():
    assert viewer_for(SLUG) == "contract_guard"
    assert viewer_for("pytest") == "workflow"


def test_client_requires_configuration(monkeypatch):
    monkeypatch.setattr(settings, "CONTRACT_GUARD_BASE_URL", None)
    assert cg_client.is_configured() is False
    with pytest.raises(ContractGuardUnavailable):
        cg_client.call("GET", "/health")


def test_user_without_the_product_is_rejected(client: TestClient, independent_user: User, product, upstream):
    r = client.get(f"{BASE}/projects", headers=auth_headers(independent_user))
    assert r.status_code == 403
    assert r.json()["detail"]["code"] == "product_not_owned"
    assert upstream.calls == []  # ni siquiera se llega al servicio


def test_unauthenticated_is_rejected(client: TestClient, product, upstream):
    assert client.get(f"{BASE}/projects").status_code == 401


def test_owner_can_create_list_and_delete_a_project(client: TestClient, buyer: User, upstream):
    h = auth_headers(buyer)
    created = client.post(f"{BASE}/projects", json={"name": "Petstore"}, headers=h)
    assert created.status_code == 201
    pid = created.json()["id"]
    assert [p["id"] for p in client.get(f"{BASE}/projects", headers=h).json()] == [pid]

    wrong = client.delete(f"{BASE}/projects/{pid}", params={"confirm_name": "otro"}, headers=h)
    assert wrong.status_code == 409 and wrong.json()["detail"]["code"] == "confirmation_required"
    assert client.delete(f"{BASE}/projects/{pid}", params={"confirm_name": "Petstore"}, headers=h).status_code == 204
    assert client.get(f"{BASE}/projects", headers=h).json() == []


def test_projects_are_isolated_between_users(client: TestClient, db: Session, buyer: User, product, upstream):
    mine = client.post(f"{BASE}/projects", json={"name": "Mio"}, headers=auth_headers(buyer)).json()["id"]

    other = make_user_with_role(
        db, email="otro@example.com", role_code="independent_user",
        org_type=OrganizationType.individual, role_scope=RoleScope.personal_workspace,
    )
    CatalogPurchasesRepository(db).add(other.id, product.id, organization_id=None, source="free")
    db.commit()
    h = auth_headers(other)

    assert client.get(f"{BASE}/projects", headers=h).json() == []
    assert client.get(f"{BASE}/projects/{mine}", headers=h).status_code == 404
    assert client.delete(f"{BASE}/projects/{mine}", params={"confirm_name": "Mio"}, headers=h).status_code == 404


def test_comparison_report_of_another_user_is_not_readable(client: TestClient, db: Session, buyer: User, product, upstream):
    pid = client.post(f"{BASE}/projects", json={"name": "Mio"}, headers=auth_headers(buyer)).json()["id"]
    cid = client.post(
        f"{BASE}/projects/{pid}/comparisons",
        json={"baseline_id": str(uuid.uuid4()), "candidate_id": str(uuid.uuid4())},
        headers=auth_headers(buyer),
    ).json()["id"]
    assert client.get(f"{BASE}/comparisons/{cid}", headers=auth_headers(buyer)).status_code == 200

    other = make_user_with_role(
        db, email="otro2@example.com", role_code="independent_user",
        org_type=OrganizationType.individual, role_scope=RoleScope.personal_workspace,
    )
    CatalogPurchasesRepository(db).add(other.id, product.id, organization_id=None, source="free")
    db.commit()
    assert client.get(f"{BASE}/comparisons/{cid}", headers=auth_headers(other)).status_code == 404
    assert client.get(f"{BASE}/comparisons/{cid}/export", headers=auth_headers(other)).status_code == 404


def test_export_is_a_json_attachment(client: TestClient, buyer: User, upstream):
    h = auth_headers(buyer)
    pid = client.post(f"{BASE}/projects", json={"name": "Mio"}, headers=h).json()["id"]
    cid = client.post(
        f"{BASE}/projects/{pid}/comparisons",
        json={"baseline_id": str(uuid.uuid4()), "candidate_id": str(uuid.uuid4())}, headers=h,
    ).json()["id"]
    r = client.get(f"{BASE}/comparisons/{cid}/export", headers=h)
    assert r.status_code == 200
    assert f"comparison-{cid}.json" in r.headers["content-disposition"]


def test_project_limit_per_user(client: TestClient, buyer: User, upstream, monkeypatch):
    monkeypatch.setattr(settings, "CONTRACT_GUARD_MAX_PROJECTS_PER_USER", 1)
    h = auth_headers(buyer)
    assert client.post(f"{BASE}/projects", json={"name": "A"}, headers=h).status_code == 201
    r = client.post(f"{BASE}/projects", json={"name": "B"}, headers=h)
    assert r.status_code == 409 and r.json()["detail"]["code"] == "project_limit_reached"


def test_stateless_schema_validation_is_forwarded(client: TestClient, buyer: User, upstream):
    r = client.post(f"{BASE}/validations/schema", json={"schema": {}, "response_body": None}, headers=auth_headers(buyer))
    assert r.status_code == 200 and r.json()["valid"] is True


def test_upstream_down_returns_503(client: TestClient, buyer: User, upstream):
    upstream.fail_with = ContractGuardUnavailable("Contract Guard is unreachable")
    r = client.post(f"{BASE}/projects", json={"name": "A"}, headers=auth_headers(buyer))
    assert r.status_code == 503 and r.json()["detail"]["code"] == "contract_guard_unavailable"


def test_status_reports_not_configured(client: TestClient, buyer: User, monkeypatch):
    monkeypatch.setattr(settings, "CONTRACT_GUARD_BASE_URL", None)
    assert client.get(f"{BASE}/status", headers=auth_headers(buyer)).json()["configured"] is False


def test_tool_shows_up_as_testable_without_workflow(client: TestClient, buyer: User, product, upstream):
    frameworks = client.get("/api/v1/test-execution/frameworks", headers=auth_headers(buyer)).json()
    entry = next(f for f in frameworks if f["slug"] == SLUG)
    assert entry["viewer"] == "contract_guard"
    assert entry["includedRuns"] == 0


def test_workflow_configured_overrides_custom_viewer(db: Session, buyer: User, product: CatalogItem):
    """Si el producto tiene test_workflow_file, se ejecuta como workflow."""
    from app.modules.test_execution.service import TestExecutionService

    product.test_workflow_file = "contract-guard.yml"
    product.test_repo_url = "https://github.com/x/y.git"
    product.test_included_runs = 5
    db.commit()
    rows = TestExecutionService(db).list_runnable_frameworks(user_id=buyer.id)
    mine = [r for r in rows if r["slug"] == product.slug]
    assert mine and mine[0]["viewer"] == "workflow"
    assert mine[0]["includedRuns"] == 5


def test_hidden_required_field_is_not_required(db: Session, buyer: User, product: CatalogItem):
    """Un campo obligatorio oculto por visible_when no bloquea la ejecución."""
    from app.modules.test_execution.service import MissingVariablesError, TestExecutionService

    product.test_workflow_file = "run-tests.yml"
    product.test_repo_url = "https://github.com/x/y.git"
    product.test_input_schema_json = [
        {"key": "mode", "label": "mode", "type": "choice", "required": True, "options": ["a", "b"]},
        {"key": "only_a", "label": "only_a", "type": "text", "required": True,
         "visible_when": {"key": "mode", "values": ["a"]}},
    ]
    db.commit()
    svc = TestExecutionService(db)
    resolved, _ = svc._resolve_variables(item=product, user_id=buyer.id, inline={"mode": "b"})
    assert resolved == {"mode": "b"}
    with pytest.raises(MissingVariablesError):
        svc._resolve_variables(item=product, user_id=buyer.id, inline={"mode": "a"})


# --- Campos «file»: viajan comprimidos dentro del workflow_dispatch ---------


def test_file_value_is_gzipped_into_the_dispatch_input():
    import base64
    import gzip

    from app.modules.test_execution import uploads

    raw = b"openapi: 3.0.0\n" * 500
    value = "file:v1.yaml:" + base64.b64encode(raw).decode()
    out = uploads.encode_file_value(value)
    prefix, name, packed = out.split(":", 2)
    assert prefix + ":" == uploads.ENCODED_PREFIX and name == "v1.yaml"
    assert gzip.decompress(base64.b64decode(packed)) == raw
    assert len(out) < len(value) / 4


def test_file_value_validation():
    import base64

    from app.modules.test_execution import uploads

    ok = base64.b64encode(b"{}").decode()
    with pytest.raises(uploads.UploadError):
        uploads.encode_file_value(f"file:x.exe:{ok}")
    with pytest.raises(uploads.UploadError):
        uploads.encode_file_value("file:x.json:%%%")
    big = base64.b64encode(b"a" * (uploads.MAX_FILE_BYTES + 1)).decode()
    with pytest.raises(uploads.UploadError):
        uploads.encode_file_value(f"file:x.json:{big}")
    with pytest.raises(uploads.UploadError):
        uploads.check_budget({"a": "x" * 70_000})


def test_unpublished_products_are_not_runnable(db: Session, buyer: User, product: CatalogItem):
    """Un borrador o «próximamente» con workflow no se lista ni se ejecuta."""
    from app.modules.test_execution.service import FrameworkNotRunnableError, TestExecutionService

    product.test_workflow_file = "run-tests.yml"
    product.test_repo_url = "https://github.com/x/y.git"
    product.test_included_runs = 3
    svc = TestExecutionService(db)
    for status in (CatalogItemStatus.draft, CatalogItemStatus.coming_soon):
        product.status = status
        db.commit()
        assert all(r["slug"] != product.slug for r in svc.list_runnable_frameworks(user_id=buyer.id))
        with pytest.raises(FrameworkNotRunnableError):
            svc.trigger_run(user_id=buyer.id, slug=product.slug)
    product.status = CatalogItemStatus.published
    db.commit()
    assert any(r["slug"] == product.slug for r in svc.list_runnable_frameworks(user_id=buyer.id))
