"""
Seed readable demo audit events for the enterprise audit view.

Usage from repository root:
  python scripts/seed_demo_audit_logs.py
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = REPO_ROOT / "ase_backend"

os.chdir(BACKEND_ROOT)
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlalchemy import select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

import app.models  # noqa: E402, F401
from app.core.database import SessionLocal  # noqa: E402
from app.models.audit_log import AuditLog  # noqa: E402
from app.models.enums import OrganizationStatus, OrganizationType, UserStatus  # noqa: E402
from app.models.organization import Organization  # noqa: E402
from app.models.user import User  # noqa: E402
from app.modules.auth.security import hash_password  # noqa: E402

DEMO_PASSWORD = "AuditDemo!2026"

DEMO_USERS = [
    {
        "email": "roberto.arce.audit.demo@ase.local",
        "first_name": "Roberto",
        "last_name": "Arce",
        "display_name": "Roberto Arce",
    },
    {
        "email": "maria.cordero.audit.demo@ase.local",
        "first_name": "Maria",
        "last_name": "Cordero",
        "display_name": "Maria Cordero",
    },
    {
        "email": "elena.alcantara.audit.demo@ase.local",
        "first_name": "Elena",
        "last_name": "Alcantara",
        "display_name": "Elena Alcantara",
    },
]

DEMO_ORGANIZATIONS = [
    {"name": "Arce Sabin Engineering", "slug": "arce-sabin-engineering-demo"},
    {"name": "Nova Learning Lab", "slug": "nova-learning-lab-demo"},
    {"name": "Atlas Cloud Partners", "slug": "atlas-cloud-partners-demo"},
]


def get_or_create_user(db: Session, data: dict[str, str]) -> User:
    user = db.execute(select(User).where(User.email == data["email"])).scalar_one_or_none()
    if user is not None:
        return user

    user = User(
        email=data["email"],
        password_hash=hash_password(DEMO_PASSWORD),
        first_name=data["first_name"],
        last_name=data["last_name"],
        display_name=data["display_name"],
        status=UserStatus.active,
        email_verified_at=datetime.now(timezone.utc),
    )
    db.add(user)
    db.flush()
    return user


def get_or_create_organization(db: Session, data: dict[str, str], owner: User) -> Organization:
    org = db.execute(select(Organization).where(Organization.slug == data["slug"])).scalar_one_or_none()
    if org is not None:
        return org

    org = Organization(
        name=data["name"],
        slug=data["slug"],
        type=OrganizationType.enterprise,
        owner_user_id=owner.id,
        status=OrganizationStatus.active,
    )
    db.add(org)
    db.flush()
    return org


def add_event_once(
    db: Session,
    *,
    key: str,
    organization: Organization | None,
    actor: User | None,
    action: str,
    entity_type: str,
    detail: str,
    created_at: datetime,
    metadata: dict[str, str],
) -> bool:
    exists = db.execute(select(AuditLog.id).where(AuditLog.entity_id == key)).scalar_one_or_none()
    if exists is not None:
        return False

    db.add(
        AuditLog(
            organization_id=organization.id if organization else None,
            actor_user_id=actor.id if actor else None,
            action=action,
            entity_type=entity_type,
            entity_id=key,
            metadata_json={
                "demo_seed_key": key,
                "detail": detail,
                **metadata,
            },
            created_at=created_at,
        )
    )
    return True


def main() -> None:
    db = SessionLocal()
    try:
        users = {data["display_name"]: get_or_create_user(db, data) for data in DEMO_USERS}
        orgs = [get_or_create_organization(db, data, users["Roberto Arce"]) for data in DEMO_ORGANIZATIONS]

        now = datetime.now(timezone.utc).replace(microsecond=0)
        events = [
            {
                "key": "demo-audit-organization-created",
                "organization": orgs[0],
                "actor": users["Roberto Arce"],
                "action": "CREATED",
                "entity_type": "Organization",
                "detail": "Roberto Arce creo la organizacion Arce Sabin Engineering.",
                "created_at": now - timedelta(hours=1, minutes=12),
                "metadata": {"organization": orgs[0].name, "change": "Nueva organizacion creada"},
            },
            {
                "key": "demo-audit-roberto-login",
                "organization": orgs[0],
                "actor": users["Roberto Arce"],
                "action": "LOGIN",
                "entity_type": "Auth",
                "detail": "Roberto Arce inicio sesion correctamente.",
                "created_at": now - timedelta(hours=2, minutes=5),
                "metadata": {"method": "password", "result": "success"},
            },
            {
                "key": "demo-audit-plan-updated",
                "organization": orgs[1],
                "actor": users["Maria Cordero"],
                "action": "UPDATED",
                "entity_type": "Plan",
                "detail": "Maria Cordero actualizo el plan Enterprise.",
                "created_at": now - timedelta(days=1, hours=3),
                "metadata": {"plan": "Enterprise", "field": "price"},
            },
            {
                "key": "demo-audit-subscription-created",
                "organization": orgs[2],
                "actor": users["Elena Alcantara"],
                "action": "CREATED",
                "entity_type": "Subscription",
                "detail": "Elena Alcantara creo una suscripcion anual.",
                "created_at": now - timedelta(days=1, hours=6),
                "metadata": {"subscription": "Annual business subscription", "status": "active"},
            },
            {
                "key": "demo-audit-course-updated",
                "organization": orgs[1],
                "actor": users["Maria Cordero"],
                "action": "UPDATED",
                "entity_type": "Course",
                "detail": "Maria Cordero actualizo el curso de automatizacion.",
                "created_at": now - timedelta(days=2, hours=4),
                "metadata": {"course": "Automation Foundations", "field": "curriculum"},
            },
            {
                "key": "demo-audit-user-deleted",
                "organization": orgs[0],
                "actor": users["Roberto Arce"],
                "action": "DELETED",
                "entity_type": "User",
                "detail": "Roberto Arce elimino un usuario inactivo.",
                "created_at": now - timedelta(days=2, hours=8),
                "metadata": {"user": "inactive.user@example.com", "reason": "Account cleanup"},
            },
            {
                "key": "demo-audit-failed-login",
                "organization": None,
                "actor": None,
                "action": "FAILED_LOGIN",
                "entity_type": "Auth",
                "detail": "Sistema registro un intento fallido de login.",
                "created_at": now - timedelta(days=3, minutes=35),
                "metadata": {"actor": "Sistema", "result": "failed_login", "risk": "medium"},
            },
            {
                "key": "demo-audit-product-created",
                "organization": orgs[2],
                "actor": users["Elena Alcantara"],
                "action": "CREATED",
                "entity_type": "Product",
                "detail": "Elena Alcantara creo un producto premium.",
                "created_at": now - timedelta(days=4, hours=2),
                "metadata": {"product": "Premium Automation Toolkit", "status": "active"},
            },
        ]

        created = sum(1 for event in events if add_event_once(db, **event))
        db.commit()
        print(f"Demo audit seed completed. Created events: {created}. Existing events skipped: {len(events) - created}.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
