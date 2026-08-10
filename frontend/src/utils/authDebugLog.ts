/** Temporary DEV-only auth flow logs (never log full tokens). */
export function authDebugLog(event: string, detail?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return
  console.info('[auth]', event, detail ?? {})
}

export function tokenMeta(accessToken: string | undefined | null): { length: number; prefix: string | null } {
  if (!accessToken) return { length: 0, prefix: null }
  return { length: accessToken.length, prefix: `${accessToken.slice(0, 8)}…` }
}

/** Structured auth diagnostics (DEV only). Never log full tokens or secrets. */
export function authDiagLog(payload: Record<string, string | boolean | number | null | undefined>): void {
  if (!import.meta.env.DEV) return
  console.info('[auth_diag]', payload)
}
