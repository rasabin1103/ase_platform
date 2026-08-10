export type SecurityOnboardingBlockedDetail = {
  code: string
  message: string
  security_onboarding_status: string
}

type Listener = (detail: SecurityOnboardingBlockedDetail) => void

let listener: Listener | null = null

export function setSecurityOnboardingBlockedListener(next: Listener | null): void {
  listener = next
}

export function emitSecurityOnboardingBlocked(detail: SecurityOnboardingBlockedDetail): void {
  listener?.(detail)
}

export function parseSecurityOnboardingError(data: unknown): SecurityOnboardingBlockedDetail | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (d.code !== 'SECURITY_ONBOARDING_REQUIRED') return null
  return {
    code: String(d.code),
    message: String(d.message ?? ''),
    security_onboarding_status: String(d.security_onboarding_status ?? ''),
  }
}
