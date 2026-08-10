-- Catalog item gallery images and book purchase links

CREATE TYPE book_purchase_platform AS ENUM (
  'amazon',
  'ase',
  'lulu',
  'gumroad',
  'shopify',
  'hotmart',
  'other'
);

CREATE TABLE catalog_item_images (
  id BIGSERIAL PRIMARY KEY,
  catalog_item_id BIGINT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  image_url VARCHAR(2048) NOT NULL,
  alt_text VARCHAR(500),
  title VARCHAR(255),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_catalog_item_images_item_sort ON catalog_item_images (catalog_item_id, sort_order, created_at);

CREATE TABLE book_purchase_links (
  id BIGSERIAL PRIMARY KEY,
  catalog_item_id BIGINT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  platform book_purchase_platform NOT NULL,
  label VARCHAR(200) NOT NULL,
  url VARCHAR(2048) NOT NULL,
  currency VARCHAR(3),
  price NUMERIC(12, 2),
  country VARCHAR(2),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_book_purchase_platform_url UNIQUE (catalog_item_id, platform, url)
);

CREATE INDEX idx_book_purchase_links_item_sort ON book_purchase_links (catalog_item_id, sort_order, created_at);
