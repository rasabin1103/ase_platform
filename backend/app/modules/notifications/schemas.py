from pydantic import BaseModel, Field


class EmailVerifyRequest(BaseModel):
    token: str = Field(min_length=10, max_length=256)


class NotificationMessageResponse(BaseModel):
    message: str
