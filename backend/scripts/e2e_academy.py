"""Apoyo de los tests E2E de ASE Academy (frontend/e2e/academy.spec.ts).

Solo contra una base de datos LOCAL: se niega a ejecutarse si DATABASE_URL no
apunta a localhost / 127.0.0.1 (nunca contra producción ni contra Supabase).

    python scripts/e2e_academy.py seed
        Crea (o deja como nuevos) los alumnos E2E, uno por curso e idioma, con
        acceso a cada curso del simulador, y borra sus partidas, intentos de
        examen y certificados anteriores. Imprime en JSON los usuarios.

    python scripts/e2e_academy.py answers <email> <course_key>
        Imprime en JSON, para el intento abierto del alumno, la opción correcta
        de cada pregunta tal como la ve en pantalla (1–4, en orden). Así el
        test puede aprobar la evaluación sin conocer el banco de preguntas.

Variables: DATABASE_URL (local), E2E_PASSWORD (por defecto «E2e-Academy!2026»).
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from decimal import Decimal
from urllib.parse import urlparse

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from app.core.config import settings  # noqa: E402

COURSES = ("testing-fundamentals", "qa-profesional", "karate-framework", "gestion-equipos-qa", "sql-iniciacion", "sql-intermedio")
LANGS = ("es", "en")
PASSWORD = os.environ.get("E2E_PASSWORD", "E2e-Academy!2026")
LOCAL_HOSTS = {"localhost", "127.0.0.1", "::1", "db", "postgres"}


def email_for(course_key: str, lang: str) -> str:
    return f"e2e.{course_key}.{lang}@arcesabinengineering.com"


def _guard() -> None:
    url = settings.sqlalchemy_database_url
    host = urlparse(str(url).replace("+psycopg", "")).hostname or ""
    if host not in LOCAL_HOSTS:
        sys.exit(f"e2e_academy: la base de datos no es local ({host or '?'}); no se toca nada.")


def seed() -> list[dict[str, str]]:
    from sqlalchemy import delete, select

    from app.core.database import SessionLocal
    from app.models.academy_exam import AcademyCertificate, AcademyExamAttempt
    from app.models.academy_run import AcademyRun
    from app.models.catalog_item import CatalogItem
    from app.models.enums import (
        CatalogItemStatus,
        CatalogItemType,
        MembershipStatus,
        OrganizationStatus,
        OrganizationType,
        UserStatus,
    )
    from app.models.member_role import MemberRole
    from app.models.organization import Organization
    from app.models.organization_member import OrganizationMember
    from app.models.role import Role
    from app.models.user import User
    from app.modules.academy.service import AcademyService
    from app.modules.auth.security import hash_password
    from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository

    out: list[dict[str, str]] = []
    with SessionLocal() as db:
        role = db.execute(select(Role).where(Role.code == "independent_user")).scalar_one_or_none()
        if role is None:
            sys.exit("e2e_academy: falta el rol independent_user (ejecuta antes scripts/seed_initial_data.py)")
        now = datetime.now(timezone.utc)

        for course_key in COURSES:
            # Ficha del catálogo que vende el curso: la que haya; si no hay ninguna, una gratuita.
            item = AcademyService(db).find_catalog_item(course_key)
            if item is None:
                item = CatalogItem(
                    title=f"E2E · {course_key}",
                    slug=f"e2e-{course_key}",
                    type=CatalogItemType.course,
                    category="Testing",
                    short_description="Curso del simulador (E2E).",
                    long_description="Ficha creada por scripts/e2e_academy.py para los tests E2E.",
                    image_url="https://www.arcesabinengineering.com/og/ase-share.png",
                    author="ASE Academy",
                    price=Decimal("0"),
                    currency="EUR",
                    status=CatalogItemStatus.published,
                    academy_course_key=course_key,
                )
                db.add(item)
                db.flush()

            for lang in LANGS:
                email = email_for(course_key, lang)
                user = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
                if user is None:
                    user = User(email=email, password_hash=hash_password(PASSWORD), status=UserStatus.active)
                    db.add(user)
                    db.flush()
                user.password_hash = hash_password(PASSWORD)
                user.status = UserStatus.active
                user.first_name, user.last_name, user.display_name = "Alumna", "E2E", "Alumna E2E"
                user.email_verified_at = user.email_verified_at or now
                user.preferred_language = lang
                user.failed_login_attempts = 0
                user.locked_until = None

                org = db.execute(select(Organization).where(Organization.slug == f"e2e-{user.id}")).scalar_one_or_none()
                if org is None:
                    org = Organization(name="Personal Workspace", slug=f"e2e-{user.id}", type=OrganizationType.individual, owner_user_id=user.id, status=OrganizationStatus.active)
                    db.add(org)
                    db.flush()
                member = db.execute(
                    select(OrganizationMember).where(OrganizationMember.organization_id == org.id, OrganizationMember.user_id == user.id)
                ).scalar_one_or_none()
                if member is None:
                    member = OrganizationMember(organization_id=org.id, user_id=user.id, membership_status=MembershipStatus.active, joined_at=now)
                    db.add(member)
                    db.flush()
                has_role = db.execute(
                    select(MemberRole.id).where(MemberRole.organization_member_id == member.id, MemberRole.role_id == role.id)
                ).first()
                if not has_role:
                    db.add(MemberRole(organization_member_id=member.id, role_id=role.id, assigned_by_user_id=user.id))

                # Acceso al curso: si la ficha es de pago, el alumno la ha comprado.
                if item.price and item.price > 0:
                    purchases = CatalogPurchasesRepository(db)
                    if item.slug not in _purchased_slugs(db, user.id):
                        purchases.add(user_id=user.id, catalog_item_id=item.id)

                # Partida limpia.
                db.execute(delete(AcademyCertificate).where(AcademyCertificate.user_id == user.id))
                db.execute(delete(AcademyExamAttempt).where(AcademyExamAttempt.user_id == user.id))
                db.execute(delete(AcademyRun).where(AcademyRun.user_id == user.id))
                out.append({"course": course_key, "lang": lang, "email": email})
        db.commit()
    return out


def _purchased_slugs(db, user_id: int) -> list[str]:
    from app.modules.consumer_catalog.service import ConsumerCatalogService

    return list(ConsumerCatalogService(db).purchased_slugs(user_id))


def answers(email: str, course_key: str) -> list[int]:
    from sqlalchemy import select

    from app.core.database import SessionLocal
    from app.models.academy_exam import AcademyExamAttempt
    from app.models.user import User

    with SessionLocal() as db:
        user = db.execute(select(User).where(User.email == email)).scalar_one()
        attempt = db.execute(
            select(AcademyExamAttempt)
            .where(AcademyExamAttempt.user_id == user.id, AcademyExamAttempt.course_key == course_key, AcademyExamAttempt.submitted_at.is_(None))
            .order_by(AcademyExamAttempt.started_at.desc())
        ).scalars().first()
        if attempt is None:
            sys.exit(f"e2e_academy: {email} no tiene un intento abierto de {course_key}")
        # En el banco la correcta es la opción 0; «order» es el orden en pantalla.
        return [q["order"].index(0) + 1 for q in attempt.questions_json]


def main() -> None:
    _guard()
    if len(sys.argv) >= 2 and sys.argv[1] == "seed":
        print(json.dumps(seed()))
    elif len(sys.argv) == 4 and sys.argv[1] == "answers":
        print(json.dumps(answers(sys.argv[2], sys.argv[3])))
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
