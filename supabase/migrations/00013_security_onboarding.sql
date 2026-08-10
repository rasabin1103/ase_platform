-- Security onboarding tracking (email + TOTP MFA). MFA columns reuse two_factor_* from 00012.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS security_onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS security_warning_dismissed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS security_warning_count INTEGER NOT NULL DEFAULT 0;
