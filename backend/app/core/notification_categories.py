"""Groups the free-form Notification.type codes into the handful of
categories a user can actually switch on/off (or get by email) from the
notifications settings page.

Notification.type stays an open string (new types never need a migration),
so the mapping lives here in code: an exact-match table plus prefix rules.
A type that matches nothing falls into "announcements" — optional, so an
unmapped type can never become an un-mutable notification by accident.
The one non-optional category is "account": security/account notices
(access, plan, creator program) always reach the user.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class NotificationCategory:
    key: str
    mandatory: bool = False


CATEGORIES: tuple[NotificationCategory, ...] = (
    NotificationCategory("catalog"),
    NotificationCategory("jobs"),
    NotificationCategory("blog"),
    NotificationCategory("organization"),
    NotificationCategory("rewards"),
    NotificationCategory("announcements"),
    NotificationCategory("account", mandatory=True),
)

CATEGORY_KEYS: frozenset[str] = frozenset(c.key for c in CATEGORIES)
MANDATORY_KEYS: frozenset[str] = frozenset(c.key for c in CATEGORIES if c.mandatory)

_EXACT: dict[str, str] = {
    "catalog_item": "catalog",
    "catalog_item_added": "catalog",
    "catalog_category": "catalog",
    "resource": "catalog",
    "job_posting": "jobs",
    "blog_post": "blog",
    "loyalty_tier_up": "rewards",
    "account_anniversary": "rewards",
    "announcement": "announcements",
    "platform": "announcements",
    "newsletter": "announcements",
    "newsletter_unsubscribe": "announcements",
    "access": "account",
    "access_request": "account",
    "access_request_created": "account",
    "plan": "account",
    "creator_program": "account",
}

_PREFIXES: tuple[tuple[str, str], ...] = (
    ("org_", "organization"),
    ("organization", "organization"),
    ("pricing_", "announcements"),
)


def category_for_type(notification_type: str) -> str:
    if notification_type in _EXACT:
        return _EXACT[notification_type]
    for prefix, category in _PREFIXES:
        if notification_type.startswith(prefix):
            return category
    return "announcements"


def types_for_category(category: str, known_types: list[str]) -> list[str]:
    """Filters a list of type codes down to those in `category` (used by the
    list endpoint's ?category= filter)."""
    return [t for t in known_types if category_for_type(t) == category]
