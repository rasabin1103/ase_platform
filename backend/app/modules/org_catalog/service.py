from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.catalog_item import CatalogItem
from app.modules.consumer_catalog.purchases_repository import CatalogPurchasesRepository
from app.modules.consumer_catalog.repository import ConsumerCatalogRepository
from app.modules.consumer_catalog.service import ConsumerCatalogService
from app.modules.org_catalog.repository import OrganizationCatalogRepository
from app.modules.org_catalog.schemas import (
    CatalogByType,
    CourseRecipientStat,
    GrantProductResponse,
    GrantTargetRead,
    MemberCatalogStatItem,
    MemberCatalogStatRead,
    MembersByRole,
    OrganizationAnalyticsResponse,
    OrgCatalogItemListResponse,
    SpendByType,
)


class OrgCatalogService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OrganizationCatalogRepository(db)
        self.catalog_repo = ConsumerCatalogRepository(db)
        self.purchases = CatalogPurchasesRepository(db)
        self.consumer_service = ConsumerCatalogService(db)

    def _require_item(self, slug: str) -> CatalogItem:
        item = self.catalog_repo.get_by_slug(slug)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        return item

    def list_org_catalog(self, *, organization_id: int, requester_user_id: int, limit: int, offset: int) -> OrgCatalogItemListResponse:
        items, total = self.repo.list_for_org(organization_id=organization_id, limit=limit, offset=offset)
        fav = self.consumer_service.favorite_slugs(requester_user_id)
        pur = self.consumer_service.purchased_slugs(requester_user_id)
        reads = self.consumer_service._to_reads_with_ratings(
            items, user_id=requester_user_id, favorite_slugs=fav, purchased_slugs=pur
        )
        return OrgCatalogItemListResponse(items=reads, limit=limit, offset=offset, total=total)

    def associate(self, *, organization_id: int, slug: str, added_by_user_id: int) -> dict:
        item = self._require_item(slug)
        created = self.repo.associate(organization_id=organization_id, catalog_item_id=item.id, added_by_user_id=added_by_user_id)
        self.db.commit()
        return {"associated": True, "created": created}

    def remove(self, *, organization_id: int, slug: str) -> dict:
        item = self._require_item(slug)
        removed = self.repo.remove(organization_id=organization_id, catalog_item_id=item.id)
        self.db.commit()
        return {"removed": removed}

    def search_grant_targets(self, *, organization_id: int, search: str | None) -> list[GrantTargetRead]:
        users = self.repo.search_org_members(organization_id=organization_id, search=search)
        return [GrantTargetRead(uuid=u.uuid, email=u.email, displayName=u.display_name) for u in users]

    def grant(self, *, organization_id: int, granted_by_user_id: int, catalog_item_slug: str, target_user) -> GrantProductResponse:
        item = self._require_item(catalog_item_slug)
        created = self.purchases.add(
            target_user.id,
            item.id,
            granted_by_user_id=granted_by_user_id,
            organization_id=organization_id,
            source="admin_grant",
        )
        self.db.commit()
        item_read = self.consumer_service.get_by_slug(catalog_item_slug, user_id=target_user.id)
        return GrantProductResponse(
            granted=created,
            alreadyOwned=not created,
            item=item_read,
            targetEmail=target_user.email,
        )

    def member_catalog_stats(self, *, organization_id: int) -> list[MemberCatalogStatRead]:
        members = self.repo.list_org_members(organization_id=organization_id)
        user_ids = [u.id for u in members]
        rows = self.repo.member_catalog_purchases(user_ids=user_ids)

        buckets: dict[int, dict[str, list[MemberCatalogStatItem]]] = {
            u.id: {"sent": [], "consumed": []} for u in members
        }
        for purchase, item in rows:
            bucket = buckets.get(purchase.user_id)
            if bucket is None:
                continue
            entry = MemberCatalogStatItem(slug=item.slug, title=item.title, type=item.type.value, imageUrl=item.image_url)
            bucket["consumed"].append(entry)
            if purchase.organization_id == organization_id:
                bucket["sent"].append(entry)

        return [
            MemberCatalogStatRead(
                uuid=u.uuid,
                email=u.email,
                displayName=u.display_name,
                sentCount=len(buckets[u.id]["sent"]),
                consumedCount=len(buckets[u.id]["consumed"]),
                sentItems=buckets[u.id]["sent"],
                consumedItems=buckets[u.id]["consumed"],
            )
            for u in members
        ]

    def analytics(self, *, organization_id: int) -> OrganizationAnalyticsResponse:
        spend_rows = self.repo.spend_breakdown(organization_id=organization_id)
        catalog_rows = self.repo.associated_catalog_by_type(organization_id=organization_id)
        role_rows = self.repo.members_by_role(organization_id=organization_id)
        course_rows = self.repo.course_recipient_counts(organization_id=organization_id)

        total_spend = sum((s for _, s, _ in spend_rows), Decimal("0"))

        return OrganizationAnalyticsResponse(
            currency="EUR",
            totalSpend=total_spend,
            spendByType=[SpendByType(type=t, totalSpend=s, count=c) for t, s, c in spend_rows],
            catalogByType=[CatalogByType(type=t, count=c) for t, c in catalog_rows],
            membersByRole=[MembersByRole(roleCode=r, count=c) for r, c in role_rows],
            courseRecipients=[
                CourseRecipientStat(slug=slug, title=title, recipientCount=c) for slug, title, c in course_rows
            ],
        )
