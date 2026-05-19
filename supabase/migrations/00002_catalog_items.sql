-- Reference migration: consumer catalog items

DO $$ BEGIN
  CREATE TYPE catalog_item_type AS ENUM ('product', 'course', 'book', 'resource');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE catalog_item_status AS ENUM ('published', 'draft', 'archived', 'coming_soon', 'request_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE catalog_item_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS catalog_items (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(160) NOT NULL UNIQUE,
  type catalog_item_type NOT NULL,
  category VARCHAR(120) NOT NULL,
  short_description VARCHAR(500) NOT NULL,
  long_description TEXT NOT NULL,
  image_url VARCHAR(2048) NOT NULL,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  status catalog_item_status NOT NULL DEFAULT 'published',
  level catalog_item_level NOT NULL DEFAULT 'beginner',
  duration VARCHAR(80),
  author VARCHAR(200) NOT NULL,
  preview_url VARCHAR(2048),
  benefits_json JSONB,
  requirements_json JSONB,
  included_items_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_catalog_items_slug ON catalog_items(slug);
CREATE INDEX IF NOT EXISTS ix_catalog_items_type ON catalog_items(type);
CREATE INDEX IF NOT EXISTS ix_catalog_items_status ON catalog_items(status);
