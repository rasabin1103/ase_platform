"""Credibility content seed: team, testimonials, case studies.

IMPORTANT — every row here is created with ``is_active=False``. This is
intentional: none of this content should reach the public site until a
human has confirmed it is real (or, for case studies, explicitly approved
as an anonymized-but-true account). Do not flip ``is_active`` to True on
placeholder/example rows — that would present fabricated content as real
social proof, which is a deceptive practice regardless of intent.

Applied by ``scripts/seed_initial_data.py`` (see ``apply_credibility_content_seed``).
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.case_study import CaseStudy
from app.models.team_member import TeamMember
from app.models.testimonial import Testimonial

# --- Team --------------------------------------------------------------
# One draft row using the account owner's name. Confirm/edit role_title and
# bio, add a real photo_url, then set is_active=True when ready to publish.
TEAM_MEMBERS: list[dict] = [
    {
        "full_name": "Roberto Arce",
        "role_title": "Founder — [confirmar cargo exacto]",
        "bio": (
            "[Borrador — sustituir por una bio real: trayectoria, especialidad "
            "técnica y qué tipo de proyectos lidera en ASE.]"
        ),
        "photo_url": None,
        "linkedin_url": None,
        "display_order": 0,
    },
]

# --- Testimonials --------------------------------------------------------
# Draft placeholders only. Replace author_name/role/company/quote with real,
# attributable client or student feedback before activating.
TESTIMONIALS: list[dict] = [
    {
        "author_name": "[Ejemplo — nombre real del cliente]",
        "author_role": "[Cargo]",
        "author_company": "[Empresa o \"Independiente\"]",
        "quote": (
            "[Ejemplo de testimonio — sustituir por una cita real de un cliente "
            "o alumno antes de publicar. No activar con este texto.]"
        ),
        "avatar_url": None,
        "rating": None,
        "is_featured": False,
        "display_order": 0,
    },
    {
        "author_name": "[Ejemplo — nombre real del alumno]",
        "author_role": "[Rol]",
        "author_company": None,
        "quote": (
            "[Ejemplo de testimonio de un curso/skill comprado — sustituir por "
            "feedback real antes de publicar.]"
        ),
        "avatar_url": None,
        "rating": None,
        "is_featured": False,
        "display_order": 1,
    },
]

# --- Case studies ----------------------------------------------------
# Draft placeholders aligned to ASE's real service lines (see
# app/seed_data/services_catalog.py). Replace with real engagements
# (client name can stay anonymized, e.g. "Fintech Serie A") before activating.
CASE_STUDIES: list[dict] = [
    {
        "slug": "draft-qa-automation-case",
        "title": "[Ejemplo] Arquitectura de automatización QA",
        "client_label": "[Ejemplo — p.ej. \"Fintech Serie A\" o nombre real]",
        "industry": "[Sector]",
        "summary": "[Resumen breve del proyecto — sustituir antes de publicar.]",
        "challenge": "[Qué problema tenía el cliente antes de trabajar con ASE.]",
        "solution": "[Qué se construyó/implementó.]",
        "results_json": ["[Resultado medible 1]", "[Resultado medible 2]"],
        "cover_image_url": None,
        "display_order": 0,
    },
    {
        "slug": "draft-saas-platform-case",
        "title": "[Ejemplo] Plataforma SaaS multi-tenant",
        "client_label": "[Ejemplo — nombre real o anonimizado]",
        "industry": "[Sector]",
        "summary": "[Resumen breve del proyecto — sustituir antes de publicar.]",
        "challenge": "[Contexto y restricciones iniciales.]",
        "solution": "[Arquitectura y enfoque de entrega.]",
        "results_json": ["[Resultado medible 1]", "[Resultado medible 2]"],
        "cover_image_url": None,
        "display_order": 1,
    },
]


def apply_credibility_content_seed(db: Session) -> dict[str, int]:
    """Upsert draft rows for team/testimonials/case studies. All inactive by default."""
    created = {"team_members": 0, "testimonials": 0, "case_studies": 0}

    for spec in TEAM_MEMBERS:
        exists = db.execute(
            select(TeamMember.id).where(TeamMember.full_name == spec["full_name"])
        ).scalar_one_or_none()
        if exists is None:
            db.add(TeamMember(is_active=False, **spec))
            created["team_members"] += 1

    for spec in TESTIMONIALS:
        exists = db.execute(
            select(Testimonial.id).where(
                Testimonial.author_name == spec["author_name"],
                Testimonial.display_order == spec["display_order"],
            )
        ).scalar_one_or_none()
        if exists is None:
            db.add(Testimonial(is_active=False, **spec))
            created["testimonials"] += 1

    for spec in CASE_STUDIES:
        exists = db.execute(
            select(CaseStudy.id).where(CaseStudy.slug == spec["slug"])
        ).scalar_one_or_none()
        if exists is None:
            db.add(CaseStudy(is_active=False, **spec))
            created["case_studies"] += 1

    db.flush()
    return created
