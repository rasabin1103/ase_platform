from __future__ import annotations

MAX_IMAGE_BYTES = 2 * 1024 * 1024
ALLOWED_IMAGE_MIMES = frozenset({"image/jpeg", "image/png", "image/webp", "image/gif"})


def validate_image_upload(content: bytes, content_type: str | None) -> str:
    if len(content) > MAX_IMAGE_BYTES:
        raise ValueError("Image exceeds 2 MB limit")
    mime = (content_type or "application/octet-stream").split(";")[0].strip().lower()
    if mime not in ALLOWED_IMAGE_MIMES:
        raise ValueError("Unsupported image type. Use JPEG, PNG, WebP or GIF.")
    return mime
