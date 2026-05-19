from __future__ import annotations

import secrets

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.enums import InvitationStatus
from app.models.invitation import Invitation
from app.modules.invitations.repository import InvitationsRepository
from app.modules.invitations.schemas import InvitationCreate, InvitationUpdate


def _generate_token() -> str:
    # ~43 chars url-safe, strong entropy
    return secrets.token_urlsafe(32)


class InvitationsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = InvitationsRepository(db)

    def create(self, payload: InvitationCreate) -> Invitation:
        org_id = self.repo.get_organization_id(
            organization_id=payload.organization_id, organization_uuid=payload.organization_uuid
        )
        if org_id is None or not self.repo.organization_exists(org_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Organization not found")

        if not self.repo.role_exists(payload.role_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role not found")

        invited_by_id = self.repo.get_user_id(
            user_id=payload.invited_by_user_id, user_uuid=payload.invited_by_user_uuid
        )
        if invited_by_id is None or not self.repo.user_exists(invited_by_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invited by user not found")

        token = payload.token or _generate_token()
        if self.repo.get_by_token(token) is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token already exists")

        inv = Invitation(
            organization_id=org_id,
            email=str(payload.email),
            role_id=payload.role_id,
            token=token,
            status=payload.status,
            expires_at=payload.expires_at,
            invited_by_user_id=invited_by_id,
        )

        try:
            self.repo.add(inv)
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token already exists")

        self.db.refresh(inv)
        return inv

    def list(
        self,
        *,
        limit: int,
        offset: int,
        organization_id: int | None,
        email: str | None,
        status_filter: InvitationStatus | None,
    ) -> tuple[list[Invitation], int]:
        return self.repo.list(limit=limit, offset=offset, organization_id=organization_id, email=email, status=status_filter)

    def get(self, invitation_id: int) -> Invitation:
        inv = self.repo.get(invitation_id)
        if inv is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
        return inv

    def update(self, invitation_id: int, payload: InvitationUpdate) -> Invitation:
        inv = self.get(invitation_id)
        fields_set = payload.model_fields_set

        if payload.email is not None:
            inv.email = str(payload.email)

        if payload.role_id is not None and payload.role_id != inv.role_id:
            if not self.repo.role_exists(payload.role_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role not found")
            inv.role_id = payload.role_id

        if payload.status is not None:
            inv.status = payload.status

        if payload.expires_at is not None:
            inv.expires_at = payload.expires_at

        if "token" in fields_set:
            if payload.token is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token cannot be null")
            if payload.token != inv.token and self.repo.get_by_token(payload.token) is not None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token already exists")
            inv.token = payload.token

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token already exists")

        self.db.refresh(inv)
        return inv

    def expire(self, invitation_id: int) -> Invitation:
        inv = self.get(invitation_id)
        inv.status = InvitationStatus.expired
        self.db.commit()
        self.db.refresh(inv)
        return inv

