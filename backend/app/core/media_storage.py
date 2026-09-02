from __future__ import annotations

import io
import logging

from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 2 * 1024 * 1024
ALLOWED_IMAGE_MIMES = frozenset({"image/jpeg", "image/png", "image/webp", "image/gif"})

# Every image we store lives as raw bytes in Postgres (Supabase) and gets
# billed as DB egress on every first view of every new visitor — before this,
# uploads were stored verbatim (whatever an admin's phone/screenshot tool
# produced, averaging 1.5-1.7 MB each) with zero resizing or compression.
# These caps are chosen per how large the image is ever actually rendered:
# covers/gallery photos can be zoomed (see the catalog click-to-zoom
# feature), avatars never render above a small thumbnail.
COVER_MAX_DIMENSION = 1600
AVATAR_MAX_DIMENSION = 512
_JPEG_QUALITY = 82


def validate_image_upload(content: bytes, content_type: str | None) -> str:
    if len(content) > MAX_IMAGE_BYTES:
        raise ValueError("Image exceeds 2 MB limit")
    mime = (content_type or "application/octet-stream").split(";")[0].strip().lower()
    if mime not in ALLOWED_IMAGE_MIMES:
        raise ValueError("Unsupported image type. Use JPEG, PNG, WebP or GIF.")
    return mime


def process_image_upload(
    content: bytes, content_type: str | None, *, max_dimension: int = COVER_MAX_DIMENSION
) -> tuple[bytes, str]:
    """Validates an uploaded image (same rules as `validate_image_upload`),
    then downscales it to `max_dimension` on its longest side and re-encodes
    as JPEG — cuts typical uploads by roughly 10-20x with no visible quality
    loss at the sizes these are ever displayed, which is the single biggest
    lever against Supabase egress cost since it applies to every image this
    app stores. Animated GIFs are returned untouched (resizing would
    collapse them to a single frame). Anything Pillow can't decode falls
    back to storing the original rather than failing the whole upload —
    `validate_image_upload` above already rejected anything not claiming to
    be one of the allowed image mimetypes, so this should be rare.
    """
    mime = validate_image_upload(content, content_type)
    if mime == "image/gif":
        return content, mime
    try:
        image = Image.open(io.BytesIO(content))
        image = ImageOps.exif_transpose(image) or image  # respect phone camera orientation
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
        # Occasionally (tiny/already-compressed source images) the
        # re-encode can come out larger than the original — keep whichever
        # is smaller rather than assuming the transform always helps.
        if len(optimized) < len(content):
            return optimized, "image/jpeg"
        return content, mime
    except Exception:
        logger.exception("Failed to optimize uploaded image, storing original")
        return content, mime
