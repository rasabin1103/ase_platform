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


class DataRowRead(BaseModel):
    id: int
    # Only a capped, sensitive-field-filtered subset of the table's real
    # columns (see _pick_display_columns in service.py) — never the raw row.
    columns: dict[str, str | None]
    # True for the one row (the acting super admin's own user/org) that a
    # full-domain wipe of a special domain would also preserve — the UI uses
    # this to disable its checkbox rather than let a row-level delete undo
    # that same protection.
    protected: bool = False


class DataRowListResponse(BaseModel):
    table: str
    tables: list[str]  # every table in the domain, for the UI's table selector
    columns: list[str]
    rows: list[DataRowRead]
    total: int
    page: int
    page_size: int


class RowDeleteRequest(BaseModel):
    table: str
    ids: list[int] = Field(min_length=1, max_length=500)
    # Deliberately no confirm_phrase here: a handful of row deletes is meant
    # to feel lighter than the full-domain wipe, which already requires
    # typing the exact phrase. The password is still required.
    password: str = Field(min_length=1, max_length=200)


class RowDeleteResponse(BaseModel):
    table: str
    rows_deleted: int
    message: str


class RowExportRequest(BaseModel):
    table: str
    # None/omitted = export every row currently in the table (the
    # "back up before wiping the whole domain" case). A list = export only
    # those rows (the "back up before deleting just these" case).
    ids: list[int] | None = Field(default=None, max_length=500)


class RowExportResponse(BaseModel):
    table: str
    columns: list[str]
    rows: list[dict[str, str | None]]
    total: int
    truncated: bool
