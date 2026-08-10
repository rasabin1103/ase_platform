import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { sendEmailVerification } from '../../api/auth.api'
import { TwoFactorSecuritySection } from '../../components/profile/TwoFactorSecuritySection'
import { PremiumHero } from '../../components/admin/premium/PremiumAdminUi'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../auth/AuthProvider'
import { useI18n } from '../../i18n'

export function ProfileSecurityPage() {
  const { t } = useI18n()
  const { currentUser, loadCurrentUser } = useAuth()

  const emailVerified =
    currentUser?.email_verified === true || Boolean(currentUser?.email_verified_at)
  const mfaEnabled = currentUser?.mfa_enabled === true || currentUser?.two_factor_enabled === true

  const emailSendMut = useMutation({
    mutationFn: sendEmailVerification,
    onSuccess: () => void loadCurrentUser(),
  })

  return (
    <div className="space-y-8">
      <PremiumHero
        badge={t('profilePage.securitySection')}
        title={t('securityOnboarding.pageTitle')}
        subtitle={t('securityOnboarding.pageSubtitle')}
        actions={
          <Link to="/profile">
            <Button variant="secondary">{t('securityOnboarding.backProfile')}</Button>
          </Link>
        }
      />

      <Card className="rounded-2xl border-white/10 bg-ase-surface/80 p-6">
        <h2 className="text-lg font-semibold text-ase-text">{t('securityOnboarding.checklistTitle')}</h2>
        <p className="mt-1 text-sm text-ase-muted">{t('profilePage.twoFactorIntro')}</p>

        <ol className="mt-6 space-y-6">
          <li className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-cyan-300">1.</span>
                <span className="text-sm font-medium text-ase-text">{t('securityOnboarding.stepEmail')}</span>
                <Badge variant={emailVerified ? 'success' : 'default'}>
                  {emailVerified ? t('profilePage.verified') : t('securityOnboarding.pending')}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-ase-muted">{t('profilePage.emailHint')}</p>
            </div>
            {!emailVerified ? (
              <Button
                type="button"
                variant="outline"
                disabled={emailSendMut.isPending}
                onClick={() => emailSendMut.mutate()}
              >
                {emailSendMut.isPending
                  ? t('profilePage.emailVerifySending')
                  : t('securityOnboarding.resendEmail')}
              </Button>
            ) : null}
          </li>

          <li className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-cyan-300">2.</span>
                <span className="text-sm font-medium text-ase-text">{t('securityOnboarding.stepMfa')}</span>
                <Badge variant={mfaEnabled ? 'success' : 'default'}>
                  {mfaEnabled ? t('profilePage.twoFactorEnabled') : t('securityOnboarding.pending')}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-ase-muted">{t('securityOnboarding.stepMfaHint')}</p>
            </div>
          </li>
        </ol>

        {currentUser?.security_onboarding_status === 'completed' ? (
          <p className="mt-6 text-sm text-emerald-300">{t('securityOnboarding.completedMessage')}</p>
        ) : null}
      </Card>

      <div className="rounded-2xl border border-white/10 bg-ase-surface/60 p-1">
        <TwoFactorSecuritySection twoFactorEnabled={mfaEnabled} />
      </div>
    </div>
  )
}
