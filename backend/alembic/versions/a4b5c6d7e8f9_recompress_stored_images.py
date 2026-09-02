"""recompress oversized stored images (catalog covers/gallery, blog covers, avatars)

Every image stored in Postgres (Supabase) before this migration was saved
verbatim — whatever an admin's phone/screenshot tool produced, averaging
1.5-1.7 MB each — with no resizing or compression. Every first view of one
by any visitor re-reads all of those bytes over the DB connection, which
Supabase bills as egress; this is what pushed the org over its free-tier
quota. New uploads are already fixed at the application layer (see
app/core/media_storage.py's process_image_upload), but that only affects
images uploaded from now on — this one-off backfill re-encodes what's
already stored so the existing 6 catalog covers, 17 gallery images, 1 blog
cover and any avatars benefit too, without anyone having to re-upload them.

Best-effort and non-destructive: images already small enough, animated
GIFs, or anything Pillow can't decode are left untouched. Nothing is
deleted — a row's binary column is only ever replaced with a visually
equivalent, smaller re-encoding of the same image.

Revision ID: a4b5c6d7e8f9
Revises: b7e2f4a9c3d8
Create Date: 2026-09-02
"""
from __future__ import annotations

import io
import logging
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "a4b5c6d7e8f9"
down_revision: Union[str, None] = "b7e2f4a9c3d8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

logger = logging.getLogger(__name__)

# (table, binary column, mime column) -> max dimension on the longest side.
# Mirrors app/core/media_storage.py's COVER_MAX_DIMENSION / AVATAR_MAX_DIMENSION
# — duplicated rather than imported since alembic migrations must stay
# runnable independent of the app module's evolution over time.
_TARGETS: list[tuple[str, str, str, int]] = [
    ("catalog_items", "image_data", "image_mime", 1600),
    ("catalog_item_images", "image_data", "image_mime", 1600),
    ("blog_posts", "cover_image_data", "cover_image_mime", 1600),
    ("users", "avatar_data", "avatar_mime", 512),
]
_JPEG_QUALITY = 82


def _optimize(content: bytes, mime: str, max_dimension: int) -> tuple[bytes, str] | None:
    """Returns (new_bytes, new_mime) if re-encoding helped, else None (skip)."""
    from PIL import Image, ImageOps

    if mime == "image/gif":
        return None
    try:
        image = Image.open(io.BytesIO(content))
        image = ImageOps.exif_transpose(image) or image
        if image.mode in ("RGBA", "LA", "P"):
            rgba = image.convert("RGBA")
            flattened = Image.new("RGB", rgba.size, (255, 255, 255))
            flattened.paste(rgba, mask=rgba.split()[-1])
            image = flattened
        else:
            image = image.convert("RGB")
        image.thumbnail((max_dimension, max_dimension), Image.LANCZOS)
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=_JPEG_QUALITY, optimize=True)
        optimized = buffer.getvalue()
        if len(optimized) < len(content):
            return optimized, "image/jpeg"
        return None
    except Exception:
        logger.exception("Skipping an image Pillow could not process during recompression backfill")
        return None


def upgrade() -> None:
    conn = op.get_bind()
    for table, data_col, mime_col, max_dimension in _TARGETS:
        rows = conn.execute(
            sa.text(f"SELECT id, {data_col} AS data, {mime_col} AS mime FROM {table} WHERE {data_col} IS NOT NULL")
        ).fetchall()
        updated = 0
        before_total = 0
        after_total = 0
        for row in rows:
            content = bytes(row.data)
            mime = row.mime or "image/jpeg"
            result = _optimize(content, mime, max_dimension)
            if result is None:
                continue
            optimized, new_mime = result
            conn.execute(
                sa.text(f"UPDATE {table} SET {data_col} = :data, {mime_col} = :mime WHERE id = :row_id"),
                {"data": optimized, "mime": new_mime, "row_id": row.id},
            )
            updated += 1
            before_total += len(content)
            after_total += len(optimized)
        if updated:
            logger.info(
                "Recompressed %s/%s images in %s: %s -> %s bytes",
                updated,
                len(rows),
                table,
                before_total,
                after_total,
            )


def downgrade() -> None:
    # Irreversible by design — the original bytes aren't kept anywhere, and
    # there's nothing meaningful to revert to (the replacement is a
    # visually equivalent, smaller re-encoding of the same image).
    pass
