import { ShieldAlert, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { TwoFactorPanel } from '../profile/TwoFactorPanel'
import { useI18n } from '../../i18n'

/** Full-screen takeover shown instead of the normal app shell whenever
 * currentUser.status === 'suspended'. Almost every API endpoint already
 * rejects a suspended session server-side (see require_permission), so
 * rendering the normal dashboard around this would just be a wall of
 * broken/empty widgets — this replaces it with something actionable.
 *
 * `two_factor_required`: the account is suspended for never activating 2FA
 * within the grace period — /auth/2fa/setup + /auth/2fa/confirm still work
 * for a suspended-for-this-reason session (see AuthService), so the same
 * TwoFactorPanel used on the profile page works here unmodified; confirming
 * reactivates the account and this gate disappears on the next render.
 *
 * Anything else (including a manual admin suspension, suspension_reason
 * null): generic message, no self-service recovery — just sign out. */
export function SuspendedAccountGate() {
  const { t } = useI18n()
  const { currentUser, logout } = useAuth()
  const reason = currentUser?.suspension_reason

  return (
    <div className="flex min-h-screen items-center justify-center bg-ase-bg px-4 py-10">
      <Card className="w-full max-w-md rounded-[2rem] border-white/[0.08] bg-ase-surface p-6 shadow-soft">
        <div className="mb-4 flex items-center gap-2 text-amber-300">
          <ShieldAlert className="h-5 w-5" strokeWidth={1.75} />
          <span className="text-sm font-semibold uppercase tracking-wide">{t('suspendedGate.badge')}</span>
        </div>

        {reason === 'two_factor_required' ? (
          <>
            <h1 className="text-lg font-bold text-ase-text">{t('suspendedGate.twoFactor.title')}</h1>
            <p className="mt-2 text-sm text-ase-text2">{t('suspendedGate.twoFactor.body')}</p>
            <div className="mt-6">
              <TwoFactorPanel />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold text-ase-text">{t('suspendedGate.generic.title')}</h1>
            <p className="mt-2 text-sm text-ase-text2">{t('suspendedGate.generic.body')}</p>
          </>
        )}

        <Button variant="ghost" className="mt-6 w-full" onClick={logout}>
          <LogOut className="mr-1.5 h-4 w-4" strokeWidth={1.75} />
          {t('suspendedGate.logout')}
        </Button>
      </Card>
    </div>
  )
}
