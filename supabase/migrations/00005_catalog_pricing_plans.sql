-- Catalog pricing plans (Stripe-ready, no payment integration yet)

DO $$ BEGIN
  CREATE TYPE pricing_plan_type AS ENUM (
    'free', 'one_time', 'subscription', 'lifetime', 'request_quote'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pricing_billing_interval AS ENUM ('none', 'monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pricing_support_level AS ENUM ('none', 'basic', 'priority', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS catalog_pricing_plans (
  id SERIAL PRIMARY KEY,
  catalog_item_id INTEGER NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  description TEXT,
  plan_type pricing_plan_type NOT NULL,
  billing_interval pricing_billing_interval NOT NULL DEFAULT 'none',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  trial_days INTEGER,
  setup_fee NUMERIC(12, 2) CHECK (setup_fee IS NULL OR setup_fee >= 0),
  discount_percentage NUMERIC(5, 2) CHECK (
    discount_percentage IS NULL
    OR (discount_percentage >= 0 AND discount_percentage <= 100)
  ),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  max_users INTEGER,
  max_downloads INTEGER,
  access_duration_days INTEGER,
  includes_updates BOOLEAN NOT NULL DEFAULT FALSE,
  includes_support BOOLEAN NOT NULL DEFAULT FALSE,
  support_level pricing_support_level NOT NULL DEFAULT 'none',
  features JSONB,
  limitations JSONB,
  stripe_price_id VARCHAR(255),
  stripe_product_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_catalog_pricing_plans_item_slug UNIQUE (catalog_item_id, slug)
);

CREATE INDEX IF NOT EXISTS ix_catalog_pricing_plans_catalog_item_id
  ON catalog_pricing_plans(catalog_item_id);
CREATE INDEX IF NOT EXISTS ix_catalog_pricing_plans_is_active ON catalog_pricing_plans(is_active);
CREATE INDEX IF NOT EXISTS ix_catalog_pricing_plans_plan_type ON catalog_pricing_plans(plan_type);
