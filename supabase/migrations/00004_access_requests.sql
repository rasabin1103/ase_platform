-- Reference migration: platform access requests (MVP)

DO $$ BEGIN
  CREATE TYPE access_request_type AS ENUM (
    'product_access', 'demo_access', 'creator_access',
    'course_access', 'resource_access', 'operational',
    'creator_application', 'product_creator_application', 'course_creator_application'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE access_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE access_request_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS access_requests (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  request_type access_request_type NOT NULL,
  target_entity_type VARCHAR(100) NOT NULL,
  target_entity_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status access_request_status NOT NULL DEFAULT 'pending',
  priority access_request_priority NOT NULL DEFAULT 'normal',
  metadata_json JSONB,
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS ix_access_requests_requested_by_user_id ON access_requests(requested_by_user_id);
CREATE INDEX IF NOT EXISTS ix_access_requests_request_type ON access_requests(request_type);

-- Optional user creator flags (see alembic e5f6a7b8c9d0)
DO $$ BEGIN
  CREATE TYPE creator_status AS ENUM ('none', 'pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS can_create_content BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_status creator_status NOT NULL DEFAULT 'none';
