-- Display fields for public pricing tiers (monthly/annual, sort, popular badge).

ALTER TABLE catalog_pricing_plans
  ADD COLUMN IF NOT EXISTS monthly_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS annual_price NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS order_index INTEGER,
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN catalog_pricing_plans.monthly_price IS 'Optional explicit monthly price; falls back to price when billing_interval=monthly.';
COMMENT ON COLUMN catalog_pricing_plans.annual_price IS 'Optional explicit annual price; else (monthly_price * 12) * 0.9.';
