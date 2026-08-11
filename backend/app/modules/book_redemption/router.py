from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rate_limit import limiter
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, get_current_user_optional
from app.modules.book_redemption.schemas import (
    RedeemCodeRequest,
    RedeemedBookListResponse,
    RedeemResultRead,
)
from app.modules.book_redemption.service import BookRedemptionService

router = APIRouter(prefix="/api/v1/book-redemption", tags=["book-redemption"])


def get_service(db: Session = Depends(get_db)) -> BookRedemptionService:
    return BookRedemptionService(db)


@router.post("/redeem", response_model=RedeemResultRead)
@limiter.limit("10/minute")
def redeem_code(
    request: Request,
    payload: RedeemCodeRequest,
    user: User | None = Depends(get_current_user_optional),
    svc: BookRedemptionService = Depends(get_service),
):
    """Public — works logged-out too. Sends a GitHub collaborator invitation
    for the book's private repo. If a valid session is present, the
    redemption is tied to the account and shows up under `/me`; otherwise
    it's logged anonymously (keyed by the GitHub username)."""
    return svc.redeem(user_id=user.id if user else None, code=payload.code, github_username=payload.github_username)


@router.get("/me", response_model=RedeemedBookListResponse)
def list_my_redemptions(
    user: User = Depends(get_current_user),
    svc: BookRedemptionService = Depends(get_service),
):
    return svc.list_mine(user_id=user.id)
