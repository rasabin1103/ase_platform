from __future__ import annotations

import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.github_client import GithubInviteError, invite_collaborator
from app.core.media_urls import resolve_catalog_cover_url
from app.models.enums import CatalogItemStatus
from app.modules.book_redemption.repository import BookRedemptionRepository
from app.modules.book_redemption.schemas import (
    RedeemedBookListResponse,
    RedeemedBookRead,
    RedeemResultRead,
)

logger = logging.getLogger(__name__)


class BookRedemptionService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = BookRedemptionRepository(db)

    def redeem(self, *, user_id: int | None, code: str, github_username: str) -> RedeemResultRead:
        """Works both logged-out (public) and logged-in. Every redemption
        sends a GitHub collaborator invitation for the book's private repo —
        signed-in redemptions are idempotent per (user, book) and feed "my
        redeemed books"; anonymous redemptions have no account identity, so
        each call logs its own row, keyed by the GitHub username instead."""
        book = self.repo.find_book_by_code(code)
        if book is None or book.status == CatalogItemStatus.draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid redeem code")
        if not book.repo_url:
            # Defensive: an admin set a code but never set the repo link.
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This code is not linked to a repository yet. Contact support.",
            )
        if not settings.GITHUB_ACCESS_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="GitHub integration is not configured. Contact support.",
            )

        github_username = github_username.strip()
        try:
            invite_status = invite_collaborator(
                repo_url=book.repo_url,
                github_username=github_username,
                token=settings.GITHUB_ACCESS_TOKEN,
            )
        except GithubInviteError as exc:
            logger.warning(
                "GitHub invite failed for book %s / user %s: %s", book.id, github_username, exc
            )
            if exc.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="GitHub username not found. Check the spelling.",
                ) from exc
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not reach GitHub to grant access. Try again in a moment.",
            ) from exc

        if user_id is not None:
            redemption = self.repo.get_redemption(user_id=user_id, catalog_item_id=book.id)
            if redemption is None:
                redemption = self.repo.create_redemption(
                    user_id=user_id, catalog_item_id=book.id, github_username=github_username,
                )
            else:
                redemption.github_username = github_username
            self.db.commit()
            self.db.refresh(redemption)
        else:
            redemption = self.repo.create_redemption(
                user_id=None, catalog_item_id=book.id, github_username=github_username,
            )
            self.db.commit()
            self.db.refresh(redemption)

        return RedeemResultRead(
            catalog_item_id=book.id,
            slug=book.slug,
            title=book.title,
            image_url=resolve_catalog_cover_url(book),
            repo_url=book.repo_url,
            github_username=github_username,
            invite_status=invite_status,
            redeemed_at=redemption.created_at,
        )

    def list_mine(self, *, user_id: int) -> RedeemedBookListResponse:
        rows = self.repo.list_for_user(user_id)
        return RedeemedBookListResponse(
            items=[
                RedeemedBookRead(
                    catalog_item_id=item.id,
                    slug=item.slug,
                    title=item.title,
                    image_url=resolve_catalog_cover_url(item),
                    repo_url=item.repo_url or "",
                    github_username=redemption.github_username,
                    redeemed_at=redemption.created_at,
                )
                for redemption, item in rows
            ]
        )
