"""In-memory per-user catalog state (favorites / purchases) until dedicated tables exist."""

from __future__ import annotations

# user_id -> set of slugs
_FAVORITES: dict[int, set[str]] = {}
_PURCHASES: dict[int, set[str]] = {}


def get_favorites(user_id: int) -> set[str]:
    return _FAVORITES.setdefault(user_id, set())


def get_purchases(user_id: int) -> set[str]:
    return _PURCHASES.setdefault(user_id, set())


def set_favorites(user_id: int, slugs: list[str]) -> None:
    _FAVORITES[user_id] = set(slugs)


def set_purchases(user_id: int, slugs: list[str]) -> None:
    _PURCHASES[user_id] = set(slugs)


def toggle_favorite(user_id: int, slug: str) -> bool:
    fav = get_favorites(user_id)
    if slug in fav:
        fav.remove(slug)
        return False
    fav.add(slug)
    return True


def add_purchase(user_id: int, slug: str) -> None:
    get_purchases(user_id).add(slug)
