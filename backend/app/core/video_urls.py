"""Tráiler de vídeo de un ítem del catálogo (opcional).

Se admite un vídeo de YouTube (cualquier formato de enlace habitual: watch,
youtu.be, Shorts, embed, live, youtube-nocookie) o un archivo de vídeo propio
servido por HTTPS (.mp4 / .webm). Los enlaces de YouTube se guardan en forma
canónica (https://www.youtube.com/watch?v=ID) para que el frontend y los datos
estructurados no tengan que volver a interpretarlos.
"""

from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse

_YOUTUBE_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
_YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
}
_VIDEO_FILE_EXTENSIONS = (".mp4", ".webm")

TRAILER_URL_ERROR = (
    "El tráiler debe ser un enlace de YouTube (watch, youtu.be o Shorts) "
    "o la URL https de un vídeo .mp4 / .webm"
)


def youtube_video_id(url: str | None) -> str | None:
    """ID de 11 caracteres de un enlace de YouTube, o None si no lo es."""
    if not url:
        return None
    try:
        parsed = urlparse(url.strip())
    except ValueError:
        return None
    host = (parsed.hostname or "").lower()
    candidate: str | None = None
    if host == "youtu.be":
        candidate = parsed.path.lstrip("/").split("/")[0]
    elif host in _YOUTUBE_HOSTS:
        path = parsed.path.rstrip("/")
        if path == "/watch":
            candidate = (parse_qs(parsed.query).get("v") or [None])[0]
        else:
            parts = path.split("/")
            if len(parts) >= 3 and parts[1] in {"shorts", "embed", "live", "v"}:
                candidate = parts[2]
    if candidate and _YOUTUBE_ID_RE.match(candidate):
        return candidate
    return None


def normalize_trailer_url(value: str | None) -> str | None:
    """Vacío = sin tráiler. YouTube → forma canónica; archivo de vídeo https
    → tal cual. Cualquier otra cosa → ValueError."""
    cleaned = (value or "").strip()
    if not cleaned:
        return None
    video_id = youtube_video_id(cleaned)
    if video_id:
        return f"https://www.youtube.com/watch?v={video_id}"
    try:
        parsed = urlparse(cleaned)
    except ValueError as exc:
        raise ValueError(TRAILER_URL_ERROR) from exc
    if parsed.scheme == "https" and parsed.hostname and parsed.path.lower().endswith(_VIDEO_FILE_EXTENSIONS):
        return cleaned
    raise ValueError(TRAILER_URL_ERROR)
