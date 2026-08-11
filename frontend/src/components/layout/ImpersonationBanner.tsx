import { UserRound } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { useI18n } from '../../i18n'

/** Sticky bar shown on every private page while a super admin is viewing
 * the product as another user ("login as user" support tool). */
export function ImpersonationBanner() {
  const { t } = useI18n()
  const { isImpersonating, currentUser, stopImpersonation } = useAuth()

  if (!isImpersonating) return null

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-300/30 bg-amber-300/10 px-6 py-2 text-sm text-amber-100">
      <div className="flex items-center gap-2">
        <UserRound className="h-4 w-4" strokeWidth={1.75} />
        <span>
          {String(t('impersonation.bannerText')).replace('{{email}}', currentUser?.email ?? '')}
        </span>
      </div>
      <Button size="sm" variant="secondary" onClick={() => void stopImpersonation()}>
        {t('impersonation.returnToAdmin')}
      </Button>
    </div>
  )
}
