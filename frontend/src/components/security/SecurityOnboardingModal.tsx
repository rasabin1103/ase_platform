import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { dismissSecurityWarning, sendEmailVerification } from '../../api/auth.api'
import {
  isSecurityWarningDismissedThisSession,
  setSecurityWarningDismissedThisSession,
} from '../../auth/securityOnboardingSession'
import type { MeResponse } from '../../types/auth.types'
import { useAuth } from '../../auth/AuthProvider'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { useI18n } from '../../i18n'

type Variant = 'email' | 'mfa' | 'both'

function resolveVariant(user: MeResponse | null): Variant | null {
  if (!user?.requires_security_onboarding) return null
  const status = user.security_onboarding_status
  if (status === 'pending_email_verification') return 'email'
  if (status === 'pending_mfa_setup') return 'mfa'
  if (status === 'pending_both') return 'both'
  return 'both'
}

export function SecurityOnboardingModal() {
  const { t } = useI18n()
  const { currentUser, applyCurrentUser } = useAuth()
  const [dismissedLocally, setDismissedLocally] = useState(() => isSecurityWarningDismissedThisSession())
  const [emailFeedback, setEmailFeedback] = useState<'idle' | 'sent' | 'error'>('idle')

  const variant = useMemo(() => resolveVariant(currentUser), [currentUser])

  const dismissMut = useMutation({
    mutationFn: dismissSecurityWarning,
    onSuccess: (user) => {
      applyCurrentUser(user)
      setSecurityWarningDismissedThisSession()
      setDismissedLocally(true)
    },
  })

  const resendMut = useMutation({
    mutationFn: sendEmailVerification,
    onSuccess: () => setEmailFeedback('sent'),
    onError: () => setEmailFeedback('error'),
  })

  if (!currentUser || !variant || dismissedLocally) {
    return null
  }
  if (!currentUser.can_dismiss_security_warning && dismissedLocally) {
    return null
  }

  const titleKey =
    variant === 'email'
      ? 'securityOnboarding.titleEmail'
      : variant === 'mfa'
        ? 'securityOnboarding.titleMfa'
        : 'securityOnboarding.titleBoth'

  const bodyKey =
    variant === 'email'
      ? 'securityOnboarding.bodyEmail'
      : variant === 'mfa'
        ? 'securityOnboarding.bodyMfa'
        : 'securityOnboarding.bodyBoth'

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <Card className="max-w-lg w-full rounded-2xl border-cyan-500/20 bg-ase-surface/95 p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-ase-text">{t(titleKey)}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ase-muted">{t(bodyKey)}</p>

        {emailFeedback === 'sent' ? (
          <p className="mt-3 text-sm text-emerald-300">{t('profilePage.emailVerifySent')}</p>
        ) : null}
        {emailFeedback === 'error' ? (
          <p className="mt-3 text-sm text-ase-error">{t('profilePage.emailVerifySendError')}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {(variant === 'email' || variant === 'both') && !currentUser.email_verified ? (
            <Button
              type="button"
              variant="outline"
              disabled={resendMut.isPending}
              onClick={() => resendMut.mutate()}
            >
              {resendMut.isPending ? t('profilePage.emailVerifySending') : t('securityOnboarding.resendEmail')}
            </Button>
          ) : null}
          {(variant === 'mfa' || variant === 'both') && currentUser.email_verified && !currentUser.mfa_enabled ? (
            <Link to="/profile/security">
              <Button type="button">{t('securityOnboarding.setup2fa')}</Button>
            </Link>
          ) : null}
          <Link to="/profile/security">
            <Button type="button" variant={variant === 'mfa' && currentUser.email_verified ? 'primary' : 'secondary'}>
              {t('securityOnboarding.goToSecurity')}
            </Button>
          </Link>
          {currentUser.can_dismiss_security_warning !== false ? (
            <Button
              type="button"
              variant="ghost"
              className="text-ase-muted"
              disabled={dismissMut.isPending}
              onClick={() => dismissMut.mutate()}
            >
              {t('securityOnboarding.remindLater')}
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  )
}
