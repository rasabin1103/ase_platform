// Minimal, dependency-free JWT payload decode — only ever used to read the
// `exp` claim off our own access token for the session-expiry warning (see
// components/layout/SessionExpiryModal.tsx). Never used for anything
// security-relevant: the token is still verified server-side on every
// request as always, this is purely a client-side "how long until this
// token stops working" read.
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    // JWT uses base64url (- / _ instead of + / /, no padding) — atob()
    // only understands plain base64, so translate the alphabet and restore
    // padding before decoding.
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/** The token's `exp` claim as an epoch-milliseconds timestamp, or null if
 * the token is malformed or carries no expiry. */
export function getJwtExpiryMs(token: string): number | null {
  const payload = decodeJwtPayload(token)
  const exp = payload?.exp
  return typeof exp === 'number' ? exp * 1000 : null
}
