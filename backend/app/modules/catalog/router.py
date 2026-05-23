"""Composed HTTP routers for catalog (unchanged URL prefixes on sub-routers)."""

from __future__ import annotations

from fastapi import APIRouter

from app.modules.catalog_admin.router import router as catalog_admin_router
from app.modules.catalog_admin.books_router import router as books_admin_router
from app.modules.consumer_catalog.router import router as consumer_catalog_router
from app.modules.consumer_catalog.books_router import router as consumer_books_router
from app.modules.consumer_catalog.catalog_alias_router import router as catalog_alias_router

router = APIRouter()
router.include_router(consumer_catalog_router)
router.include_router(consumer_books_router)
router.include_router(catalog_alias_router)
router.include_router(catalog_admin_router)
router.include_router(books_admin_router)
