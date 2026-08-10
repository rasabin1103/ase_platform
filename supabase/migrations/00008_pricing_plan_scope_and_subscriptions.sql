-- Pricing plans: optional single item + catalog scope; subscriptions per plan

ALTER TABLE catalog_pricing_plans
  ALTER COLUMN catalog_item_id DROP NOT NULL;

ALTER TABLE catalog_pricing_plans
  ADD COLUMN IF NOT EXISTS scope_catalog_types JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scope_categories JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE catalog_pricing_plans DROP CONSTRAINT IF EXISTS uq_catalog_pricing_plans_item_slug;

CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_pricing_plans_item_slug
  ON catalog_pricing_plans (catalog_item_id, slug)
  WHERE catalog_item_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_pricing_plans_bundle_slug
  ON catalog_pricing_plans (slug)
  WHERE catalog_item_id IS NULL;

ALTER TABLE catalog_pricing_plans DROP CONSTRAINT IF EXISTS ck_catalog_pricing_plans_scope_or_item;

ALTER TABLE catalog_pricing_plans
  ADD CONSTRAINT ck_catalog_pricing_plans_scope_or_item CHECK (
    catalog_item_id IS NOT NULL
    OR jsonb_array_length(scope_catalog_types) > 0
  );

UPDATE catalog_pricing_plans p
SET
  scope_catalog_types = jsonb_build_array(ci.type::text),
  scope_categories = '[]'::jsonb
FROM catalog_items ci
WHERE ci.id = p.catalog_item_id
  AND (p.scope_catalog_types = '[]'::jsonb OR p.scope_catalog_types IS NULL);

CREATE TABLE IF NOT EXISTS catalog_plan_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_pricing_plan_id INTEGER NOT NULL REFERENCES catalog_pricing_plans(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_catalog_plan_subscriptions_user_plan UNIQUE (user_id, catalog_pricing_plan_id)
);

CREATE INDEX IF NOT EXISTS ix_catalog_plan_subscriptions_plan_id
  ON catalog_plan_subscriptions (catalog_pricing_plan_id);

CREATE INDEX IF NOT EXISTS ix_catalog_plan_subscriptions_user_id
  ON catalog_plan_subscriptions (user_id);
