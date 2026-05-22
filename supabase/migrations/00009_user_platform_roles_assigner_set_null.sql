-- Allow deleting users referenced as platform-role assigner (e.g. self-signup assigner_id = user.id)

ALTER TABLE user_platform_roles
  DROP CONSTRAINT IF EXISTS user_platform_roles_assigned_by_user_id_fkey;

ALTER TABLE user_platform_roles
  ALTER COLUMN assigned_by_user_id DROP NOT NULL;

ALTER TABLE user_platform_roles
  ADD CONSTRAINT user_platform_roles_assigned_by_user_id_fkey
  FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL;
