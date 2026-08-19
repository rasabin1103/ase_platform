from __future__ import annotations

from pydantic import BaseModel


class DemoAccountRead(BaseModel):
    email: str
    # Null for a demo account with no subscription at all — an independent
    # user in the exact state a free signup ends up in.
    plan_code: str | None = None
    plan_name: str | None = None
    already_existed: bool
    catalog_items_granted: int = 0


class SeedDemoUsersResponse(BaseModel):
    accounts: list[DemoAccountRead]
    demo_password: str
    note: str
