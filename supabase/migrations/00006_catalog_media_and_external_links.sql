-- Catalog book/media fields and external purchase links

DO $$ BEGIN
  CREATE TYPE catalog_purchase_provider AS ENUM ('internal', 'amazon', 'external', 'request_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(2048);
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(2048);
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS amazon_url VARCHAR(2048);
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS external_purchase_url VARCHAR(2048);
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS purchase_provider catalog_purchase_provider DEFAULT 'internal';
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(2048);
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS preview_pdf_url VARCHAR(2048);
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS preview_pages INTEGER;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS sample_download_url VARCHAR(2048);
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS rich_content_markdown TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS book_format VARCHAR(80);
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS audience_json JSONB;
