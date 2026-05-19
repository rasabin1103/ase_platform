-- Reference migration: catalog favorites & purchases

CREATE TABLE IF NOT EXISTS catalog_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_item_id INTEGER NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, catalog_item_id)
);

CREATE TABLE IF NOT EXISTS catalog_purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_item_id INTEGER NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, catalog_item_id)
);

CREATE INDEX IF NOT EXISTS ix_catalog_favorites_user_id ON catalog_favorites(user_id);
CREATE INDEX IF NOT EXISTS ix_catalog_purchases_user_id ON catalog_purchases(user_id);
