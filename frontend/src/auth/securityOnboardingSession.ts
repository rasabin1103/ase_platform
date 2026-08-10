const SESSION_DISMISS_KEY = 'ase.security_warning_dismissed'

export function isSecurityWarningDismissedThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

export function setSecurityWarningDismissedThisSession(): void {
  try {
    sessionStorage.setItem(SESSION_DISMISS_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function clearSecurityWarningDismissedSession(): void {
  try {
    sessionStorage.removeItem(SESSION_DISMISS_KEY)
  } catch {
    /* ignore */
  }
}
