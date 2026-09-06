import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n'

// Keep in sync with backend settings.TWO_FACTOR_GRACE_DAYS (app/core/config.py).
const TWO_FACTOR_GRACE_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

// Frozen once when this module loads (module-level code, not a component
// render) — reading it here instead of calling Date.now() inside the
// component body keeps the component itself a pure function of its props.
const PAGE_LOAD_TIME = Date.now()

const LAST_SHOWN_KEY_PREFIX = 'ase.2fa_grace_last_shown.'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD, local-clock-independent enough for a once-a-day gate
}

function wasAlreadyShownToday(userId: string | number): boolean {
  try {
    return localStorage.getItem(`${LAST_SHOWN_KEY_PREFIX}${userId}`) === todayStr()
  } catch {
    return false
  }
}

function markShownToday(userId: string | number): void {
  try {
    localStorage.setItem(`${LAST_SHOWN_KEY_PREFIX}${userId}`, todayStr())
  } catch {
    // best-effort — private browsing / quota exceeded just means it may
    // reappear more than once a day, not worth failing over
  }
}

/** Warning modal for signed-in users who haven't activated 2FA yet — shown
 * only once per calendar day (the first time they're in a session that
 * day), tracked per-account in localStorage so it doesn't nag on every
 * reload/navigation the rest of the day. Reappears the next day until 2FA
 * is actually enabled. See app/core/account_lifecycle.py for the backend
 * suspension policy this is warning about. */
export function TwoFactorGraceModal() {
  const { t } = useI18n()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  const daysLeft = currentUser?.created_at
    ? Math.max(0, Math.ceil((new Date(currentUser.created_at).getTime() + TWO_FACTOR_GRACE_DAYS * DAY_MS - PAGE_LOAD_TIME) / DAY_MS))
    : null

  const alreadyShownToday = currentUser ? wasAlreadyShownToday(currentUser.uuid) : true

  const shouldShow =
    Boolean(currentUser) &&
    currentUser?.status === 'active' &&
    !currentUser?.two_factor_enabled &&
    !dismissed &&
    !alreadyShownToday &&
    daysLeft !== null

  // Recorded as soon as it's actually shown (not just on dismiss) — a user
  // who never interacts with it shouldn't see it again on a second page
  // load the same day either.
  useEffect(() => {
    if (shouldShow && currentUser) markShownToday(currentUser.uuid)
  }, [shouldShow, currentUser])

  if (!shouldShow) return null

  return (
    <Modal
      open
      onClose={() => setDismissed(true)}
      closeLabel={t('twoFactorGrace.later')}
      title={
        <span className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-300" strokeWidth={1.75} />
          {t('twoFactorGrace.title')}
        </span>
      }
      footer={
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setDismissed(true)
              navigate('/profile')
            }}
          >
            {t('twoFactorGrace.cta')}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-ase-text2">
        {daysLeft && daysLeft > 0
          ? String(t('twoFactorGrace.body')).replace('{{days}}', String(daysLeft))
          : t('twoFactorGrace.bodyToday')}
      </p>
    </Modal>
  )
}
