DO $$ BEGIN
  CREATE TYPE verification_channel AS ENUM ('email', 'sms');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS user_verification_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel verification_channel NOT NULL,
  destination VARCHAR(320) NOT NULL,
  secret_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_user_verification_challenges_user_id
  ON user_verification_challenges (user_id);
CREATE INDEX IF NOT EXISTS ix_user_verification_challenges_expires_at
  ON user_verification_challenges (expires_at);
