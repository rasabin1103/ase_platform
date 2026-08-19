from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.modules.auth.schemas import SimpleMessageResponse
from app.modules.auth.security import get_token_subject_uuid
from app.modules.newsletter.schemas import NewsletterUnsubscribeRequest
from app.modules.users.repository import UsersRepository

router = APIRouter(prefix="/api/v1/newsletter", tags=["newsletter"])


@router.post("/unsubscribe", response_model=SimpleMessageResponse)
def unsubscribe(payload: NewsletterUnsubscribeRequest, db: Session = Depends(get_db)):
    """Public, no-login-required one-click unsubscribe — the link emailed
    in every newsletter carries a long-lived signed token (see
    create_newsletter_unsubscribe_token) rather than requiring the
    recipient to log in just to opt out."""
    try:
        user_uuid = get_token_subject_uuid(payload.token, expected_type="newsletter_unsubscribe")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired unsubscribe link")

    user = UsersRepository(db).get_by_uuid(user_uuid)
    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired unsubscribe link")

    user.newsletter_subscribed = False
    db.commit()
    return SimpleMessageResponse()
