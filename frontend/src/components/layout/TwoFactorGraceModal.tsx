import { useState } from 'react'
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

/** Warning modal for signed-in users who haven't activated 2FA yet —
 * appears once per session (dismissible, reappears on the next fresh
 * login) with a countdown to the automated suspension. See
 * app/core/account_lifecycle.py for the backend policy. */
export function TwoFactorGraceModal() {
  const { t } = useI18n()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  const daysLeft = currentUser?.created_at
    ? Math.max(0, Math.ceil((new Date(currentUser.created_at).getTime() + TWO_FACTOR_GRACE_DAYS * DAY_MS - PAGE_LOAD_TIME) / DAY_MS))
    : null

  const shouldShow =
    Boolean(currentUser) &&
    currentUser?.status === 'active' &&
    !currentUser?.two_factor_enabled &&
    !dismissed &&
    daysLeft !== null

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
