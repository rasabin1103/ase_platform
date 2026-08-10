from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel

from app.modules.consumer_catalog.schemas import CatalogItemRead


class OrgCatalogItemListResponse(BaseModel):
    items: list[CatalogItemRead]
    limit: int
    offset: int
    total: int


class GrantTargetRead(BaseModel):
    uuid: UUID
    email: str
    displayName: str | None = None


class GrantTargetListResponse(BaseModel):
    items: list[GrantTargetRead]


class GrantProductRequest(BaseModel):
    catalogItemSlug: str
    userUuid: UUID


class GrantProductResponse(BaseModel):
    granted: bool
    alreadyOwned: bool
    item: CatalogItemRead
    targetEmail: str


class MemberCatalogStatItem(BaseModel):
    slug: str
    title: str
    type: str
    imageUrl: str


class MemberCatalogStatRead(BaseModel):
    uuid: UUID
    email: str
    displayName: str | None = None
    sentCount: int
    consumedCount: int
    sentItems: list[MemberCatalogStatItem]
    consumedItems: list[MemberCatalogStatItem]


class MemberCatalogStatsListResponse(BaseModel):
    items: list[MemberCatalogStatRead]


class SpendByType(BaseModel):
    type: str
    totalSpend: Decimal
    count: int


class CatalogByType(BaseModel):
    type: str
    count: int


class CourseRecipientStat(BaseModel):
    slug: str
    title: str
    recipientCount: int


class MembersByRole(BaseModel):
    roleCode: str
    count: int


class OrganizationAnalyticsResponse(BaseModel):
    currency: str
    totalSpend: Decimal
    spendByType: list[SpendByType]
    catalogByType: list[CatalogByType]
    membersByRole: list[MembersByRole]
    courseRecipients: list[CourseRecipientStat]
