"""Generate browser favicons from public/logo-source.png (preserves transparency)."""

from __future__ import annotations

import base64
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SRC = PUBLIC / "logo-source.png"

# Left emblem crop ratio (matches BrandLogo icon variant).
ICON_CROP_WIDTH_RATIO = 340 / 1024


def _crop_icon_mark(src: Image.Image) -> Image.Image:
    """Emblem crop from logo-source.png (left mark, transparent)."""
    bbox = src.getbbox()
    if not bbox:
        return src
    crop = src.crop(bbox)
    w, h = crop.size
    if w > h * 1.5:
        icon_w = max(1, int(w * ICON_CROP_WIDTH_RATIO))
        return crop.crop((0, 0, min(icon_w, w), h))
    return crop


def _fit_on_transparent_canvas(icon: Image.Image, side: int, *, padding: int = 8) -> Image.Image:
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    inner = side - padding * 2
    scale = min(inner / icon.width, inner / icon.height)
    nw, nh = max(1, int(icon.width * scale)), max(1, int(icon.height * scale))
    resized = icon.resize((nw, nh), Image.Resampling.LANCZOS)
    ox, oy = (side - nw) // 2, (side - nh) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def main() -> None:
    src = Image.open(SRC).convert("RGBA")
    icon = _crop_icon_mark(src)

    master = _fit_on_transparent_canvas(icon, 512, padding=24)

    for size, name in [
        (16, "favicon-16.png"),
        (32, "favicon-32.png"),
        (48, "favicon-48.png"),
        (192, "favicon-192.png"),
        (180, "apple-touch-icon.png"),
    ]:
        out = master.resize((size, size), Image.Resampling.LANCZOS)
        out.save(PUBLIC / name, optimize=True)

    icon_32 = master.resize((32, 32), Image.Resampling.LANCZOS)
    icon_32.save(PUBLIC / "favicon.png", optimize=True)
    icon_32.save(PUBLIC / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32)])

    buf = BytesIO()
    icon_32.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="ASE">'
        f'<image href="data:image/png;base64,{b64}" width="32" height="32"/>'
        "</svg>"
    )
    (PUBLIC / "favicon.svg").write_text(svg, encoding="utf-8")
    print("favicons_ok transparent", icon.size, SRC.name)


if __name__ == "__main__":
    main()
