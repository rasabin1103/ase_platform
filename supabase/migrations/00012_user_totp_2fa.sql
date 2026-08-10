-- TOTP authenticator 2FA (no SMS). Secrets stored application-side; see totp_crypto for encryption TODO.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
  ADD COLUMN IF NOT EXISTS two_factor_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS two_factor_recovery_codes JSONB;

COMMENT ON COLUMN users.two_factor_secret IS 'TOTP secret (plain: prefix until app-level encryption). Never expose via API.';
COMMENT ON COLUMN users.two_factor_recovery_codes IS 'JSON array of SHA-256 hashes of recovery codes (ASE-XXXX-XXXX).';
