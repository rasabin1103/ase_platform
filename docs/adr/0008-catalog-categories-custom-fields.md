# 0008 — Catalog categories are metadata on top of a free-text field, not a foreign key

## Context

Catalog items already had a free-text `category` string field with existing production data (arbitrary values, no referential integrity). The ask was to let admins define categories with a custom "questionnaire" (per-category custom fields) for items in that category, without breaking existing items or requiring a data-migration/backfill of every existing category value into a new managed table.

## Decision

`CatalogCategory` is a new, separate table (name, slug, `fields_json` — a list of field-definition dicts: key/label/type/required/options) that is **not** foreign-keyed to `CatalogItem.category`. The item's `category` stays a free-text string exactly as before. A new `CatalogItem.custom_fields_json` column stores the actual answers, keyed by whatever field keys the selected category defines at creation time. The admin item form looks up the category by matching its free-text `category` string against the managed `CatalogCategory.name` list, to decide which custom-field questionnaire to render — but nothing enforces that match at the database level.

## Alternatives considered

- **Foreign-key `catalog_items.category_id → catalog_categories.id`, migrate existing string values into rows.** Rejected: requires a backfill migration reconciling every distinct existing string value (including typos/inconsistent casing already in production data) into canonical category rows before the FK constraint could be added — a bigger, riskier change than the feature justified, and blocks the feature on a data-cleanup project.
- **No structured category table at all — store custom fields as a schema-less bag directly on the item.** Rejected: doesn't let an admin manage categories as first-class entities (rename, reorder, deactivate) or reuse one field schema across many items in the same category.

## Consequences

- There is no database-level guarantee that an item's free-text `category` actually matches a managed `CatalogCategory.name` — an item can reference a category that was since renamed or deleted, and its `custom_fields_json` becomes orphaned data with no schema to validate against. The admin form handles this gracefully today (falls back to showing the item's current category value as an option even if it doesn't match anything managed), but this is a known soft spot, not a solved one.
- Renaming a managed category does not cascade to items already using the old string value — they keep the old string and silently stop matching the (renamed) category's field schema.
- This was the pragmatic MVP tradeoff; if categories become a hard requirement for catalog integrity later, revisit the FK approach with a proper backfill.
