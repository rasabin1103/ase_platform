import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { refreshTokens } from '../../api/auth.api'
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '../../auth/auth.store'
import { getJwtExpiryMs } from '../../utils/jwt'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n'

// How long before the access token actually expires the warning appears —
// long enough to read the message and click a button, short enough that it
// doesn't nag minutes ahead of time. Independent of how long the token's
// own lifetime is (ACCESS_TOKEN_EXPIRE_MINUTES server-side) — this only
// controls when the countdown starts being shown.
const WARNING_BEFORE_MS = 60_000
const TICK_MS = 1000

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Warns a signed-in user shortly before their access token expires and
 * offers a one-click way to stay signed in (silently trades the refresh
 * token for a new pair via POST /auth/refresh — no re-entering credentials).
 * If the countdown runs out with no response, the session is closed and the
 * user is sent back to /login, same as any other expired-session logout.
 *
 * Mounted once in AppLayout (inside ProtectedRoute), so it only ever runs
 * for an authenticated user and always has router context to redirect
 * with. */
export function SessionExpiryModal() {
  const { t } = useI18n()
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const [remainingMs, setRemainingMs] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  // Guards against double-firing the auto-logout once the countdown hits
  // zero — the 1s interval can tick again before state/navigation settle.
  const loggedOutRef = useRef(false)

  const doLogout = useCallback(() => {
    if (loggedOutRef.current) return
    loggedOutRef.current = true
    logout()
    navigate('/login', { replace: true })
  }, [logout, navigate])

  useEffect(() => {
    if (!currentUser) return
    loggedOutRef.current = false

    const tick = () => {
      const token = getAccessToken()
      if (!token) return
      const expiryMs = getJwtExpiryMs(token)
      if (expiryMs === null) return
      const left = expiryMs - Date.now()
      setRemainingMs(left)
      if (left <= 0) doLogout()
    }

    tick()
    const interval = window.setInterval(tick, TICK_MS)
    return () => window.clearInterval(interval)
  }, [currentUser, doLogout])

  const handleContinue = async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      doLogout()
      return
    }
    setRefreshing(true)
    setRefreshFailed(false)
    try {
      const tokens = await refreshTokens(refreshToken)
      setAccessToken(tokens.access_token)
      setRefreshToken(tokens.refresh_token)
      const expiryMs = getJwtExpiryMs(tokens.access_token)
      setRemainingMs(expiryMs !== null ? expiryMs - Date.now() : null)
    } catch {
      // Refresh token itself is expired/revoked — nothing left to try but a
      // real logout; the countdown's own auto-logout would otherwise fire a
      // few seconds later anyway, this just does it right away with a clear
      // reason shown for a beat first.
      setRefreshFailed(true)
      window.setTimeout(doLogout, 2000)
    } finally {
      setRefreshing(false)
    }
  }

  if (!currentUser || remainingMs === null || remainingMs > WARNING_BEFORE_MS || remainingMs <= 0) return null

  return (
    <Modal
      open
      // The header close button is wired to the same explicit "end the
      // session now" action as the footer button below — closing this
      // warning should never silently leave a session that's about to
      // expire in limbo, so there's no ambiguous dismiss gesture here.
      onClose={doLogout}
      closeLabel={t('sessionExpiry.logoutNow')}
      allowFullscreen={false}
      title={
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-300" strokeWidth={1.75} />
          {t('sessionExpiry.title')}
        </span>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-sm text-ase-muted">{formatCountdown(remainingMs)}</span>
          <Button onClick={handleContinue} disabled={refreshing}>
            {refreshing ? t('sessionExpiry.continuing') : t('sessionExpiry.cta')}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-ase-text2">
        {refreshFailed ? t('sessionExpiry.refreshFailed') : t('sessionExpiry.body')}
      </p>
    </Modal>
  )
}
