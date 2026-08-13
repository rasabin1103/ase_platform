from __future__ import annotations

from pydantic import BaseModel, Field


class DataDomainRead(BaseModel):
    key: str
    label: str
    tables: list[str]
    row_count: int
    extra_tables: list[str]
    confirm_phrase: str
    is_special: bool


class DataDomainListResponse(BaseModel):
    domains: list[DataDomainRead]
    master_confirm_phrase: str
    super_admin_email: str


class ResetExecuteRequest(BaseModel):
    confirm_phrase: str = Field(min_length=1, max_length=200)
    password: str = Field(min_length=1, max_length=200)


class ResetExecuteResponse(BaseModel):
    tables_wiped: list[str]
    rows_deleted: int
    preserved_user_email: str
    message: str
