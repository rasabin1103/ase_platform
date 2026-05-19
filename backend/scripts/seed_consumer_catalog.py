"""Idempotent seed for consumer catalog items (SaaS, course, book, resource)."""

from __future__ import annotations

import os
import sys
from decimal import Decimal

from sqlalchemy import select

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from app.core.database import SessionLocal
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemLevel, CatalogItemStatus, CatalogItemType

DEMO_ITEMS = [
    {
        "slug": "ase-qa-platform-saas",
        "title": "ASE QA Platform",
        "type": CatalogItemType.product,
        "category": "SaaS",
        "short_description": "Multi-tenant QA automation platform with RBAC and audit trails.",
        "long_description": (
            "Enterprise-grade SaaS to orchestrate test automation, quality gates and release "
            "confidence across teams. Includes workspace isolation, role-based access and "
            "operator dashboards."
        ),
        "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
        "price": Decimal("49.00"),
        "currency": "EUR",
        "level": CatalogItemLevel.intermediate,
        "duration": "Subscription",
        "author": "Arce Sabin Engineering",
        "preview_url": "https://example.com/preview/ase-qa-platform",
        "benefits_json": [
            "Unlimited test projects per workspace",
            "RBAC with audit logs",
            "CI integrations (GitHub, GitLab, Azure)",
            "Executive quality dashboard",
        ],
        "requirements_json": [
            "Modern browser (Chrome, Firefox, Edge)",
            "Git provider for CI webhooks",
        ],
        "included_items_json": [
            "Cloud-hosted platform access",
            "Email support (business hours)",
            "Monthly usage reports",
        ],
    },
    {
        "slug": "playwright-mastery-course",
        "title": "Playwright Mastery",
        "type": CatalogItemType.course,
        "category": "Automation",
        "short_description": "Hands-on course: reliable E2E tests with Playwright and TypeScript.",
        "long_description": (
            "Learn to design maintainable end-to-end suites: fixtures, tracing, parallel runs, "
            "and CI feedback loops. Includes labs and a capstone project."
        ),
        "image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
        "price": Decimal("129.00"),
        "currency": "EUR",
        "level": CatalogItemLevel.beginner,
        "duration": "12 hours",
        "author": "ASE Academy",
        "preview_url": "https://example.com/preview/playwright-mastery",
        "benefits_json": [
            "12h video + labs",
            "Certificate of completion",
            "Starter template repository",
            "Community Q&A access",
        ],
        "requirements_json": ["Basic JavaScript/TypeScript", "Node.js 18+"],
        "included_items_json": [
            "8 modules + capstone",
            "Downloadable cheat-sheets",
            "Lifetime access to updates",
        ],
    },
    {
        "slug": "architecture-patterns-book",
        "title": "Architecture Patterns for SaaS",
        "type": CatalogItemType.book,
        "category": "Engineering",
        "short_description": "Practical guide to multi-tenant design, RBAC and operability.",
        "long_description": (
            "A concise reference for teams building B2B SaaS: tenancy models, authorization, "
            "billing boundaries, observability and incremental delivery."
        ),
        "image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
        "price": Decimal("34.90"),
        "currency": "EUR",
        "level": CatalogItemLevel.advanced,
        "duration": "320 pages",
        "author": "R. Sabín",
        "preview_url": "https://example.com/preview/architecture-patterns",
        "benefits_json": [
            "Print + digital formats",
            "Diagrams and checklists",
            "Case studies from real platforms",
        ],
        "requirements_json": ["Familiarity with web backends"],
        "included_items_json": ["PDF + ePub", "Bonus appendix on audit logging"],
    },
    {
        "slug": "ci-pipeline-starter-kit",
        "title": "CI Pipeline Starter Kit",
        "type": CatalogItemType.resource,
        "category": "Templates",
        "short_description": "Downloadable GitHub Actions templates for test gates and deploy previews.",
        "long_description": (
            "Production-ready workflow templates: lint, unit, integration, E2E and artifact "
            "publishing. Customize per stack in minutes."
        ),
        "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
        "price": Decimal("19.00"),
        "currency": "EUR",
        "level": CatalogItemLevel.intermediate,
        "duration": "Instant download",
        "author": "ASE Templates",
        "preview_url": "https://example.com/preview/ci-starter-kit",
        "benefits_json": [
            "Copy-paste GitHub Actions",
            "Documented customization points",
            "Security scanning job included",
        ],
        "requirements_json": ["GitHub repository", "Basic YAML"],
        "included_items_json": [
            "ZIP with workflows + docs",
            "Example secrets checklist",
            "Changelog and upgrade guide",
        ],
    },
]


def main() -> None:
    db = SessionLocal()
    try:
        created = 0
        for spec in DEMO_ITEMS:
            existing = db.execute(select(CatalogItem).where(CatalogItem.slug == spec["slug"])).scalar_one_or_none()
            if existing:
                continue
            item = CatalogItem(
                title=spec["title"],
                slug=spec["slug"],
                type=spec["type"],
                category=spec["category"],
                short_description=spec["short_description"],
                long_description=spec["long_description"],
                image_url=spec["image_url"],
                price=spec["price"],
                currency=spec["currency"],
                status=CatalogItemStatus.published,
                level=spec["level"],
                duration=spec["duration"],
                author=spec["author"],
                preview_url=spec["preview_url"],
                benefits_json=spec["benefits_json"],
                requirements_json=spec["requirements_json"],
                included_items_json=spec["included_items_json"],
            )
            db.add(item)
            created += 1
        db.commit()
        print(f"Consumer catalog seed done. Created {created} item(s).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
