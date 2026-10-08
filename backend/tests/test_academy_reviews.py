"""Opiniones del curso del simulador: cualquier alumno con acceso puede
valorarlo (estrellas + comentario) y las opiniones se ven en público con el
nombre abreviado."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import RoleScope
from app.models.permission import Permission
from app.models.role import Role
from app.models.role_permission import RolePermission
from app.models.user import User
from app.modules.catalog_showcase.service import CatalogShowcaseService
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository

from tests.test_academy_access import CATALOG_URL, _course

REVIEW_URL = "/api/v1/consumer-catalog/{slug}/review"
PUBLIC_URL = "/api/v1/catalog-showcase/course/{slug}/reviews"
SLUG = "fundamentos-testing-simulador"


@pytest.fixture(autouse=True)
def _independent_can_review(db: Session, independent_user: User) -> None:
    """En producción el seed RBAC da ratings.manage_own al rol
    independent_user; aquí se concede igual que en test_purchase_flow."""
    role = db.execute(select(Role).where(Role.code == "independent_user")).scalar_one_or_none()
    if role is None:
        role = Role(code="independent_user", name="independent_user", scope=RoleScope.personal_workspace)
        db.add(role)
        db.flush()
    perm = db.execute(select(Permission).where(Permission.code == "ratings.manage_own")).scalar_one_or_none()
    if perm is None:
        perm = Permission(code="ratings.manage_own", name="ratings.manage_own", module="consumer_catalog")
        db.add(perm)
        db.flush()
    db.add(RolePermission(role_id=role.id, permission_id=perm.id))
    db.commit()


def test_free_course_review_is_public_with_short_name(
    client: TestClient, db: Session, super_admin_headers: dict[str, str], independent_user: User, independent_headers: dict[str, str]
):
    independent_user.first_name = "Lucía"
    independent_user.last_name = "Gómez Pérez"
    db.commit()
    client.post(CATALOG_URL, json=_course(price=0), headers=super_admin_headers)
    r = client.post(REVIEW_URL.format(slug=SLUG), json={"rating": 5, "comment": "Aprendí muchísimo"}, headers=independent_headers)
    assert r.status_code == 200, r.text

    body = client.get(PUBLIC_URL.format(slug=SLUG)).json()
    assert body["reviewCount"] == 1
    assert body["averageRating"] == 5
    assert body["items"][0]["comment"] == "Aprendí muchísimo"
    assert body["items"][0]["userDisplayName"] == "Lucía G."


def test_paid_course_review_requires_purchase(
    client: TestClient, db: Session, super_admin_headers: dict[str, str], independent_user: User, independent_headers: dict[str, str]
):
    created = client.post(CATALOG_URL, json=_course(), headers=super_admin_headers).json()
    url = REVIEW_URL.format(slug=SLUG)
    assert client.post(url, json={"rating": 4}, headers=independent_headers).status_code == 403
    CatalogPurchasesRepository(db).add(user_id=independent_user.id, catalog_item_id=created["id"])
    db.commit()
    assert client.post(url, json={"rating": 4}, headers=independent_headers).status_code == 200


def test_public_reviews_hide_draft_courses(client: TestClient, super_admin_headers: dict[str, str]):
    client.post(CATALOG_URL, json=_course(price=0, status="draft"), headers=super_admin_headers)
    assert client.get(PUBLIC_URL.format(slug=SLUG)).status_code == 404
    assert client.get("/api/v1/catalog-showcase/book/no-existe/reviews").status_code == 404


def test_public_reviewer_name_never_leaks_surname_or_email():
    name = CatalogShowcaseService._public_reviewer_name
    assert name(None, "Ana", "López") == "Ana L."
    assert name("ana.lopez@example.com", None, None) == "Alumno ASE"
    assert name(None, None, None) == "Alumno ASE"
