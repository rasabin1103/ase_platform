from __future__ import annotations

"""
Re-translate (ES -> EN, via DeepL) catalog item copy that was never translated.

Items created or edited outside the admin form (seeds, direct SQL) end up with
``title_en`` / ``short_description_en`` / ``long_description_en`` equal to the
Spanish text, or empty. This script fills those with a real DeepL translation.

- Needs ``DEEPL_API_KEY`` in ``backend/.env``.
- Only touches fields whose English mirror is empty or identical to the Spanish.
- Idempotent: re-running does nothing once everything is translated.
- ``--dry-run`` lists what would change; ``--slug <slug>`` limits it to one item.

Usage (from ``backend/``):  python -m scripts.retranslate_catalog_en [--dry-run] [--slug curso-sql-desde-cero]
"""

import argparse
import os
import sys

from sqlalchemy import select

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from app.core.database import SessionLocal
from app.core.translation import translate_es_to_en, translation_configured
from app.models.catalog_item import CatalogItem

PAIRS = (
    ("title", "title_en"),
    ("short_description", "short_description_en"),
    ("long_description", "long_description_en"),
)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--slug")
    args = parser.parse_args()

    if not translation_configured():
        print("DEEPL_API_KEY is not set in backend/.env: nothing was translated.")
        return 1

    changed = 0
    with SessionLocal() as db:
        stmt = select(CatalogItem)
        if args.slug:
            stmt = stmt.where(CatalogItem.slug == args.slug)
        for item in db.scalars(stmt):
            for es_field, en_field in PAIRS:
                es_value = getattr(item, es_field, None)
                en_value = getattr(item, en_field, None)
                if not es_value or (en_value and en_value.strip() != es_value.strip()):
                    continue
                if args.dry_run:
                    print(f"[dry-run] {item.slug}: {en_field}")
                    changed += 1
                    continue
                translated = translate_es_to_en(es_value)
                if translated is None:
                    print(f"[skip] {item.slug}: {en_field} (DeepL failed)")
                    continue
                setattr(item, en_field, translated)
                changed += 1
                print(f"[ok] {item.slug}: {en_field}")
        if not args.dry_run:
            db.commit()
    print(f"Done: {changed} field(s) {'to translate' if args.dry_run else 'translated'}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
