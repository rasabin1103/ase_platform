import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  setSecurityOnboardingBlockedListener,
  type SecurityOnboardingBlockedDetail,
} from '../../auth/securityOnboardingEvents'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n'

export function SecurityOnboardingProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const [blocked, setBlocked] = useState<SecurityOnboardingBlockedDetail | null>(null)

  useEffect(() => {
    setSecurityOnboardingBlockedListener((detail) => setBlocked(detail))
    return () => setSecurityOnboardingBlockedListener(null)
  }, [])

  return (
    <>
      {children}
      {blocked ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
          <Card className="max-w-md rounded-2xl border-amber-500/30 bg-ase-surface p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-ase-text">{t('securityOnboarding.blockedTitle')}</h2>
            <p className="mt-2 text-sm text-ase-muted">{t('securityOnboarding.blockedBody')}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to="/profile/security">
                <Button type="button" onClick={() => setBlocked(null)}>
                  {t('securityOnboarding.goToSecurity')}
                </Button>
              </Link>
              <Button type="button" variant="secondary" onClick={() => setBlocked(null)}>
                {t('securityOnboarding.blockedClose')}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  )
}
