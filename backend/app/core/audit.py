from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def record_audit_log(
    db: Session,
    *,
    actor_user_id: int | None,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    organization_id: int | None = None,
    metadata: dict[str, Any] | None = None,
) -> None:
    """Best-effort audit trail write for admin actions (catalog edits, user
    management, access-request reviews, ...). Never raises — like the
    notifications helper, a logging failure must never block or roll back
    the primary write it's describing. Call this *after* the primary
    operation has already committed."""
    from app.models.audit_log import AuditLog  # local import avoids import cycles

    try:
        db.add(
            AuditLog(
                organization_id=organization_id,
                actor_user_id=actor_user_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                metadata_json=metadata,
            )
        )
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Failed to record audit log: action=%s entity_type=%s entity_id=%s", action, entity_type, entity_id)
