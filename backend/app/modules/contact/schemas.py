from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator


class ContactSubmitRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    company: str | None = Field(default=None, max_length=200)
    subject: str = Field(min_length=1, max_length=300)
    inquiry_type: str | None = Field(default=None, max_length=120)
    message: str = Field(min_length=20, max_length=5000)

    @field_validator("name", "subject", "message", "company", "inquiry_type", mode="before")
    @classmethod
    def strip_strings(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value


class ContactSubmitResponse(BaseModel):
    message: str = "Message sent successfully"
