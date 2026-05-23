from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.media_urls import catalog_has_stored_image
from app.models.catalog_item import CatalogItem
from app.models.enums import CatalogItemType
from app.modules.catalog.catalog_media_schemas import BookPurchaseLinkRead, CatalogItemImageRead
from app.modules.catalog.catalog_media_sync import is_internal_media_url, sync_book_purchase_links, sync_catalog_images
from app.modules.catalog_admin.validation import validate_catalog_fields
from app.modules.catalog_admin.schemas import (
    CatalogItemAdminCreate,
    CatalogItemAdminListResponse,
    CatalogItemAdminRead,
    CatalogItemAdminUpdate,
)
from app.modules.catalog.catalog_read_fields import catalog_media_fields
from app.modules.consumer_catalog.repository import ConsumerCatalogRepository


class CatalogAdminService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ConsumerCatalogRepository(db)

    def _image_reads(self, item: CatalogItem) -> list[CatalogItemImageRead]:
        rows = sorted(item.images, key=lambda i: (i.sort_order, i.created_at))
        return [
            CatalogItemImageRead(
                id=img.id,
                imageUrl=img.image_url,
                altText=img.alt_text,
                title=img.title,
                sortOrder=img.sort_order,
                isPrimary=img.is_primary,
                createdAt=img.created_at,
                updatedAt=img.updated_at,
            )
            for img in rows
        ]

    def _link_reads(self, item: CatalogItem, *, active_only: bool = False) -> list[BookPurchaseLinkRead]:
        rows = sorted(item.purchase_links, key=lambda l: (l.sort_order, l.created_at))
        if active_only:
            rows = [l for l in rows if l.is_active]
        return [
            BookPurchaseLinkRead(
                id=link.id,
                platform=link.platform,
                label=link.label,
                url=link.url,
                currency=link.currency,
                price=link.price,
                country=link.country,
                isPrimary=link.is_primary,
                isActive=link.is_active,
                sortOrder=link.sort_order,
                createdAt=link.created_at,
                updatedAt=link.updated_at,
            )
            for link in rows
        ]

    def _to_read(self, item: CatalogItem) -> CatalogItemAdminRead:
        media = catalog_media_fields(item)
        return CatalogItemAdminRead(
            id=item.id,
            uuid=item.uuid,
            title=item.title,
            slug=item.slug,
            type=item.type,
            category=item.category,
            short_description=item.short_description,
            long_description=item.long_description,
            image_url=media["display_image_url"],
            has_stored_image=catalog_has_stored_image(item),
            preview_url=item.preview_url,
            price=item.price,
            currency=item.currency,
            status=item.status,
            level=item.level,
            duration=item.duration,
            author=item.author,
            benefits=item.benefits_json or [],
            requirements=item.requirements_json or [],
            included_items=item.included_items_json or [],
            cover_image_url=item.cover_image_url,
            thumbnail_url=item.thumbnail_url,
            amazon_url=item.amazon_url,
            external_purchase_url=item.external_purchase_url,
            purchase_provider=media["purchase_provider"],
            pdf_url=item.pdf_url,
            preview_pdf_url=item.preview_pdf_url,
            preview_pages=item.preview_pages,
            sample_download_url=item.sample_download_url,
            rich_content_markdown=item.rich_content_markdown,
            book_format=item.book_format,
            audience=item.audience_json or [],
            images=self._image_reads(item),
            purchase_links=self._link_reads(item),
            created_at=item.created_at,
            updated_at=item.updated_at,
        )

    def _load_item(self, item_id: int) -> CatalogItem:
        item = self.db.get(CatalogItem, item_id)
        if item is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog item not found")
        return item

    def get(self, item_id: int) -> CatalogItemAdminRead:
        return self._to_read(self._load_item(item_id))

    def list(
        self,
        *,
        limit: int,
        offset: int,
        type_filter: CatalogItemType | None = None,
        search: str | None = None,
    ) -> CatalogItemAdminListResponse:
        items, total = self.repo.list(
            limit=limit,
            offset=offset,
            type_filter=type_filter,
            category=None,
            search=search,
            status=None,
        )
        return CatalogItemAdminListResponse(
            items=[self._to_read(i) for i in items],
            limit=limit,
            offset=offset,
            total=total,
        )

    def _sanitize_image_url(self, item: CatalogItem | None, image_url: str | None) -> str | None:
        if image_url is None:
            return None
        if item and (catalog_has_stored_image(item) or is_internal_media_url(image_url)):
            return None
        return image_url

    def _validate_payload_urls(
        self,
        *,
        item: CatalogItem | None,
        purchase_provider,
        amazon_url,
        external_purchase_url,
        preview_pdf_url,
        pdf_url,
        sample_download_url,
        image_url,
        cover_image_url,
    ) -> None:
        image_url = self._sanitize_image_url(item, image_url)
        validate_catalog_fields(
            purchase_provider=purchase_provider,
            amazon_url=amazon_url,
            external_purchase_url=external_purchase_url,
            preview_pdf_url=preview_pdf_url,
            pdf_url=pdf_url,
            sample_download_url=sample_download_url,
            image_url=image_url,
            cover_image_url=cover_image_url,
            skip_image_url_if_stored=bool(item and catalog_has_stored_image(item)),
        )

    def _apply_item_fields(self, item: CatalogItem, data: dict) -> None:
        if "benefits" in data:
            item.benefits_json = data.pop("benefits")
        if "requirements" in data:
            item.requirements_json = data.pop("requirements")
        if "included_items" in data:
            item.included_items_json = data.pop("included_items")
        if "audience" in data:
            item.audience_json = data.pop("audience")
        data.pop("images", None)
        data.pop("purchase_links", None)
        if "image_url" in data and self._sanitize_image_url(item, data.get("image_url")) is None:
            data.pop("image_url")
        for key, value in data.items():
            setattr(item, key, value)

    def create(self, payload: CatalogItemAdminCreate) -> CatalogItemAdminRead:
        if self.repo.get_by_slug(payload.slug):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
        self._validate_payload_urls(
            item=None,
            purchase_provider=payload.purchase_provider,
            amazon_url=payload.amazon_url,
            external_purchase_url=payload.external_purchase_url,
            preview_pdf_url=payload.preview_pdf_url,
            pdf_url=payload.pdf_url,
            sample_download_url=payload.sample_download_url,
            image_url=payload.image_url,
            cover_image_url=payload.cover_image_url,
        )
        try:
            item = CatalogItem(
                title=payload.title,
                slug=payload.slug,
                type=payload.type,
                category=payload.category,
                short_description=payload.short_description,
                long_description=payload.long_description,
                image_url=payload.image_url or "https://placeholder.local/cover",
                preview_url=payload.preview_url,
                price=payload.price,
                currency=payload.currency,
                status=payload.status,
                level=payload.level,
                duration=payload.duration,
                author=payload.author,
                benefits_json=payload.benefits,
                requirements_json=payload.requirements,
                included_items_json=payload.included_items,
                cover_image_url=payload.cover_image_url,
                thumbnail_url=payload.thumbnail_url,
                amazon_url=payload.amazon_url,
                external_purchase_url=payload.external_purchase_url,
                purchase_provider=payload.purchase_provider,
                pdf_url=payload.pdf_url,
                preview_pdf_url=payload.preview_pdf_url,
                preview_pages=payload.preview_pages,
                sample_download_url=payload.sample_download_url,
                rich_content_markdown=payload.rich_content_markdown,
                book_format=payload.book_format,
                audience_json=payload.audience,
            )
            self.db.add(item)
            self.db.flush()
            sync_catalog_images(self.db, item, [img.model_dump() for img in payload.images])
            if payload.purchase_links:
                sync_book_purchase_links(
                    self.db,
                    item,
                    [link.model_dump() for link in payload.purchase_links],
                )
            self.db.commit()
            self.db.refresh(item)
            return self._to_read(item)
        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise

    def update(self, item_id: int, payload: CatalogItemAdminUpdate) -> CatalogItemAdminRead:
        item = self._load_item(item_id)
        data = payload.model_dump(exclude_unset=True)
        images_payload = data.pop("images", None)
        links_payload = data.pop("purchase_links", None)
        merged = {**self._to_read(item).model_dump(), **data}
        self._validate_payload_urls(
            item=item,
            purchase_provider=merged.get("purchase_provider"),
            amazon_url=merged.get("amazon_url"),
            external_purchase_url=merged.get("external_purchase_url"),
            preview_pdf_url=merged.get("preview_pdf_url"),
            pdf_url=merged.get("pdf_url"),
            sample_download_url=merged.get("sample_download_url"),
            image_url=merged.get("image_url"),
            cover_image_url=merged.get("cover_image_url"),
        )
        try:
            self._apply_item_fields(item, data)
            if images_payload is not None:
                sync_catalog_images(self.db, item, images_payload)
            if links_payload is not None:
                sync_book_purchase_links(self.db, item, links_payload)
            self.db.commit()
            self.db.refresh(item)
            return self._to_read(item)
        except HTTPException:
            self.db.rollback()
            raise
        except Exception:
            self.db.rollback()
            raise

    def delete(self, item_id: int) -> None:
        item = self._load_item(item_id)
        self.db.delete(item)
        self.db.commit()
