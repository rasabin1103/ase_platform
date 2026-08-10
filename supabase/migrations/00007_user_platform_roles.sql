-- Platform roles without organization membership (independent_user on signup)
-- Parity with Alembic revision i4j5k6l7m8

CREATE TABLE IF NOT EXISTS user_platform_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_platform_role_pair UNIQUE (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS ix_user_platform_roles_user_id ON user_platform_roles (user_id);
CREATE INDEX IF NOT EXISTS ix_user_platform_roles_role_id ON user_platform_roles (role_id);
CREATE INDEX IF NOT EXISTS ix_user_platform_roles_assigned_by_user_id ON user_platform_roles (assigned_by_user_id);
