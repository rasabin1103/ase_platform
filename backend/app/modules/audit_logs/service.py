from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.modules.audit_logs.repository import AuditLogsRepository
from app.modules.audit_logs.schemas import AuditLogCreate


class AuditLogsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AuditLogsRepository(db)

    def create(self, payload: AuditLogCreate) -> AuditLog:
        org_id = self.repo.get_organization_id(
            organization_id=payload.organization_id, organization_uuid=payload.organization_uuid
        )
        if org_id is not None and not self.repo.organization_exists(org_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization not found")

        actor_id = self.repo.get_user_id(user_id=payload.actor_user_id, user_uuid=payload.actor_user_uuid)
        if actor_id is not None and not self.repo.user_exists(actor_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Actor user not found")

        log = AuditLog(
            organization_id=org_id,
            actor_user_id=actor_id,
            action=payload.action,
            entity_type=payload.entity_type,
            entity_id=payload.entity_id,
            metadata_json=payload.metadata_json,
        )
        self.repo.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None,
        actor_user_id: int | None,
        entity_type: str | None,
        action: str | None,
        date_from: datetime | None,
        date_to: datetime | None,
    ) -> tuple[list[AuditLog], int]:
        return self.repo.list(
            limit=limit,
            offset=offset,
            organization_id=organization_id,
            actor_user_id=actor_user_id,
            entity_type=entity_type,
            action=action,
            date_from=date_from,
            date_to=date_to,
        )

    def get(self, audit_log_id: int) -> AuditLog:
        log = self.repo.get(audit_log_id)
        if log is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit log not found")
        return log

