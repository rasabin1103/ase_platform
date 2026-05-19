"""Public marketing services catalog — applied by ``scripts/seed_initial_data.py``."""

from __future__ import annotations

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.enums import ServiceCategory, ServiceKind, ServicePriceType
from app.models.service import Service
from app.models.service_feature import ServiceFeature
from app.models.service_highlight import ServiceHighlight

SERVICES_CATALOG: list[dict] = [
    {
        "code": "saas_platform_engineering",
        "name": "SaaS Platform Engineering",
        "slug": "saas-platform-engineering",
        "short_description": "Multi-tenant platforms, RBAC, billing and enterprise workflows.",
        "description": (
            "Design and delivery of production-grade SaaS platforms with tenant isolation, "
            "role-based access, subscription billing, product entitlements and audit-grade operations."
        ),
        "category": ServiceCategory.platform_engineering,
        "service_type": ServiceKind.service,
        "price_type": ServicePriceType.custom,
        "is_featured": True,
        "is_active": True,
        "display_order": 1,
        "icon": "◇",
        "hero_title": "SaaS Platform Engineering",
        "hero_subtitle": "From foundations to production operations.",
        "features": [
            "Multi-tenant architecture",
            "RBAC systems",
            "Billing & subscriptions",
            "Product access control",
            "Audit logs",
            "Enterprise workflows",
        ],
        "highlights": [
            {
                "title": "Typical scope",
                "value": "Platform MVP → scale",
                "description": "Architecture, delivery and hardening in iterative releases.",
                "display_order": 0,
            },
            {
                "title": "Stack posture",
                "value": "API-first · observable",
                "description": "Services designed for CI/CD, metrics and operational clarity.",
                "display_order": 1,
            },
        ],
    },
    {
        "code": "qa_automation_architecture",
        "name": "QA Automation Architecture",
        "slug": "qa-automation-architecture",
        "short_description": "Automation ecosystems wired into CI/CD with governance.",
        "description": (
            "End-to-end QA automation architecture: frameworks, pipelines, reporting and quality governance "
            "aligned with how your teams ship."
        ),
        "category": ServiceCategory.qa_automation,
        "service_type": ServiceKind.service,
        "price_type": ServicePriceType.custom,
        "is_featured": True,
        "is_active": True,
        "display_order": 2,
        "icon": "◆",
        "hero_title": "QA Automation Architecture",
        "hero_subtitle": "Reliable signals from automation, not noise.",
        "features": [
            "API automation frameworks",
            "UI automation ecosystems",
            "CI/CD integration",
            "Observability & reporting",
            "Test strategy",
            "Quality governance",
        ],
        "highlights": [
            {
                "title": "Integration depth",
                "value": "Pipelines + dashboards",
                "description": "Automation connected to build, deploy and quality gates.",
                "display_order": 0,
            },
            {
                "title": "Operating model",
                "value": "Governed velocity",
                "description": "Flake management, ownership and measurable release confidence.",
                "display_order": 1,
            },
        ],
    },
    {
        "code": "business_process_automation",
        "name": "Business Process Automation",
        "slug": "business-process-automation",
        "short_description": "Internal workflows, AI-assisted ops and integration fabric.",
        "description": (
            "Automation of administrative and operational workflows with pragmatic AI assistance, "
            "document flows, notifications and integrations across your toolchain."
        ),
        "category": ServiceCategory.ai_automation,
        "service_type": ServiceKind.service,
        "price_type": ServicePriceType.custom,
        "is_featured": False,
        "is_active": True,
        "display_order": 3,
        "icon": "▣",
        "hero_title": "Business Process Automation",
        "hero_subtitle": "Less manual drag. More throughput.",
        "features": [
            "Internal workflows",
            "AI-assisted operations",
            "Document automation",
            "Administrative automation",
            "Notifications & integrations",
            "Automation pipelines",
        ],
        "highlights": [
            {
                "title": "Outcome focus",
                "value": "Hours saved / week",
                "description": "Automation scoped to measurable operational leverage.",
                "display_order": 0,
            },
            {
                "title": "Safety",
                "value": "Human-in-the-loop",
                "description": "Guardrails for approvals, auditing and rollback paths.",
                "display_order": 1,
            },
        ],
    },
    {
        "code": "technical_training",
        "name": "Technical Training",
        "slug": "technical-training",
        "short_description": "Workshops, enablement and hands-on technical coaching.",
        "description": (
            "Enterprise training programs spanning QA, Python, automation engineering and team enablement — "
            "from onboarding ramps to advanced workshops."
        ),
        "category": ServiceCategory.training,
        "service_type": ServiceKind.course,
        "price_type": ServicePriceType.subscription,
        "is_featured": False,
        "is_active": True,
        "display_order": 4,
        "icon": "◎",
        "hero_title": "Technical Training",
        "hero_subtitle": "Enablement that sticks after the workshop.",
        "features": [
            "QA training",
            "Python training",
            "Automation courses",
            "Enterprise workshops",
            "Team enablement",
            "Hands-on labs",
        ],
        "highlights": [
            {
                "title": "Formats",
                "value": "Remote / onsite",
                "description": "Cohorts, intensives and embedded coaching.",
                "display_order": 0,
            },
            {
                "title": "Depth",
                "value": "Beginner → advanced",
                "description": "Progressions aligned to your stack and delivery constraints.",
                "display_order": 1,
            },
        ],
    },
    {
        "code": "premium_frameworks",
        "name": "Premium Frameworks",
        "slug": "premium-frameworks",
        "short_description": "Karate, Playwright, Pytest, WDIO accelerators for enterprise teams.",
        "description": (
            "Curated automation frameworks and reusable accelerators — structured for maintainability, "
            "CI integration and enterprise governance."
        ),
        "category": ServiceCategory.frameworks,
        "service_type": ServiceKind.framework,
        "price_type": ServicePriceType.subscription,
        "is_featured": False,
        "is_active": True,
        "display_order": 5,
        "icon": "⬡",
        "hero_title": "Premium Frameworks",
        "hero_subtitle": "Accelerators you can ship, not shelf demos.",
        "features": [
            "Karate Framework",
            "Playwright Framework",
            "Pytest API Framework",
            "WDIO ecosystems",
            "Enterprise templates",
            "Reusable accelerators",
        ],
        "highlights": [
            {
                "title": "Repositories",
                "value": "Opinionated layouts",
                "description": "Patterns for scaling suites across teams and services.",
                "display_order": 0,
            },
            {
                "title": "CI posture",
                "value": "Parallel · sharded",
                "description": "Defaults for fast feedback loops and stable pipelines.",
                "display_order": 1,
            },
        ],
    },
    {
        "code": "technical_books_digital_assets",
        "name": "Technical Books & Digital Assets",
        "slug": "technical-books-digital-assets",
        "short_description": "Books, guides, PDFs and premium technical assets.",
        "description": (
            "Premium technical books and digital assets spanning Python, SQL, QA and automation — "
            "crafted for practitioners building real systems."
        ),
        "category": ServiceCategory.digital_products,
        "service_type": ServiceKind.book,
        "price_type": ServicePriceType.fixed,
        "is_featured": False,
        "is_active": True,
        "display_order": 6,
        "icon": "▤",
        "hero_title": "Technical Books & Digital Assets",
        "hero_subtitle": "Dense, practical references — built like internal playbooks.",
        "features": [
            "Python books",
            "SQL books",
            "QA books",
            "Automation guides",
            "Premium PDFs",
            "Technical assets",
        ],
        "highlights": [
            {
                "title": "Formats",
                "value": "PDF · bundles",
                "description": "Structured chapters, checklists and worked examples.",
                "display_order": 0,
            },
            {
                "title": "Audience",
                "value": "Builders",
                "description": "Written for engineers, leads and operators — not buzzword decks.",
                "display_order": 1,
            },
        ],
    },
]


def _sync_features(db: Session, service: Service, lines: list[str]) -> None:
    n = len(lines)
    for order, text in enumerate(lines):
        row = db.execute(
            select(ServiceFeature).where(
                ServiceFeature.service_id == service.id,
                ServiceFeature.display_order == order,
            )
        ).scalar_one_or_none()
        if row is None:
            db.add(
                ServiceFeature(
                    service_id=service.id,
                    blurb=text,
                    display_order=order,
                    is_active=True,
                )
            )
        else:
            if row.blurb != text:
                row.blurb = text
            if not row.is_active:
                row.is_active = True
    db.execute(delete(ServiceFeature).where(ServiceFeature.service_id == service.id, ServiceFeature.display_order >= n))
    db.flush()


def _sync_highlights(db: Session, service: Service, rows: list[dict]) -> None:
    n = len(rows)
    for order, spec in enumerate(sorted(rows, key=lambda r: r["display_order"])):
        row = db.execute(
            select(ServiceHighlight).where(
                ServiceHighlight.service_id == service.id,
                ServiceHighlight.display_order == order,
            )
        ).scalar_one_or_none()
        title = spec["title"]
        value = spec["value"]
        desc = spec.get("description")
        if row is None:
            db.add(
                ServiceHighlight(
                    service_id=service.id,
                    title=title,
                    value=value,
                    description=desc,
                    display_order=order,
                )
            )
        else:
            row.title = title
            row.value = value
            row.description = desc
            row.display_order = order
    db.execute(
        delete(ServiceHighlight).where(
            ServiceHighlight.service_id == service.id,
            ServiceHighlight.display_order >= n,
        )
    )
    db.flush()


def apply_services_catalog_seed(db: Session) -> int:
    """Upsert catalog services by ``code``. Returns count of newly inserted ``Service`` rows."""
    created = 0
    for spec in sorted(SERVICES_CATALOG, key=lambda s: s["display_order"]):
        code = spec["code"]
        svc = db.execute(select(Service).where(Service.code == code)).scalar_one_or_none()
        common = dict(
            name=spec["name"],
            slug=spec["slug"],
            short_description=spec["short_description"],
            description=spec["description"],
            category=spec["category"],
            service_type=spec["service_type"],
            price_type=spec["price_type"],
            is_featured=spec["is_featured"],
            is_active=spec["is_active"],
            display_order=spec["display_order"],
            icon=spec.get("icon"),
            hero_title=spec.get("hero_title"),
            hero_subtitle=spec.get("hero_subtitle"),
        )
        if svc is None:
            svc = Service(code=code, **common)
            db.add(svc)
            db.flush()
            created += 1
        else:
            for k, v in common.items():
                setattr(svc, k, v)
            db.flush()

        _sync_features(db, svc, spec["features"])
        _sync_highlights(db, svc, spec["highlights"])

    return created
