from __future__ import annotations

from pydantic import BaseModel


class NewsletterSendResult(BaseModel):
    recipients: int
