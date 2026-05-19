from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import OrganizationType


class OnboardingCreateOrganizationRequest(BaseModel):
    organization_name: str = Field(min_length=1, max_length=200)
    organization_slug: str = Field(min_length=1, max_length=100)
    organization_type: OrganizationType = OrganizationType.business


class OnboardingCreateOrganizationResponse(BaseModel):
    organization_uuid: UUID
    organization_slug: str
    organization_name: str
    member_id: int
    created_at: datetime

