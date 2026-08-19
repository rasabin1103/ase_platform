from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.newsletter import run_weekly_newsletter
from app.modules.admin_newsletter.schemas import NewsletterSendResult
from app.modules.auth.dependencies import require_permission

router = APIRouter(prefix="/api/v1/admin/newsletter", tags=["admin-newsletter"])


@router.post(
    "/send-now",
    response_model=NewsletterSendResult,
    dependencies=[Depends(require_permission("platform.manage"))],
)
def send_newsletter_now(db: Session = Depends(get_db)):
    """Manually triggers the same weekly digest the Friday scheduler sends —
    useful to verify content/recipients without waiting for Friday."""
    recipients = run_weekly_newsletter(db)
    return NewsletterSendResult(recipients=recipients)
