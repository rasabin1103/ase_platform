import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { confirmTwoFactor, disableTwoFactor, setupTwoFactor } from '../../api/auth.api'
import { useAuth } from '../../auth/AuthProvider'
import { useI18n } from '../../i18n'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

type Step = 'idle' | 'setup' | 'disable'

/** Real TOTP-based 2FA setup/disable flow — replaces the previous disabled
 * "coming soon" placeholder. Setup: generate a secret + QR code, scan with
 * an authenticator app, confirm a 6-digit code. Disable: re-enter the
 * account password (never the TOTP code itself, so a lost device can never
 * lock someone out of turning 2FA back off). */
export function TwoFactorPanel() {
  const { t } = useI18n()
  const { currentUser, loadCurrentUser } = useAuth()
  const [step, setStep] = useState<Step>('idle')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const enabled = Boolean(currentUser?.two_factor_enabled)

  function resetState() {
    setStep('idle')
    setQrCode(null)
    setSecret(null)
    setCode('')
    setPassword('')
    setError(null)
  }

  const setupMut = useMutation({
    mutationFn: setupTwoFactor,
    onSuccess: (data) => {
      setQrCode(data.qr_code_data_uri)
      setSecret(data.secret)
      setStep('setup')
      setError(null)
    },
    onError: () => setError(t('profilePage.twoFactorSetupError') as string),
  })

  const confirmMut = useMutation({
    mutationFn: () => confirmTwoFactor(code),
    onSuccess: async () => {
      await loadCurrentUser()
      resetState()
    },
    onError: () => setError(t('profilePage.twoFactorConfirmError') as string),
  })

  const disableMut = useMutation({
    mutationFn: () => disableTwoFactor(password),
    onSuccess: async () => {
      await loadCurrentUser()
      resetState()
    },
    onError: () => setError(t('profilePage.twoFactorDisableError') as string),
  })

  return (
    <div className="lg:border-l lg:border-white/10 lg:pl-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-ase-text">{t('profilePage.twoFactor')}</span>
        <Badge variant={enabled ? 'success' : 'default'}>
          {enabled ? t('profilePage.twoFactorEnabled') : t('profilePage.twoFactorDisabled')}
        </Badge>
      </div>

      {step === 'idle' && (
        <>
          <p className="text-xs text-ase-muted">
            {enabled ? t('profilePage.twoFactorEnabledHint') : t('profilePage.twoFactorDescription')}
          </p>
          <Button
            type="button"
            variant={enabled ? 'outline' : 'secondary'}
            className="mt-3"
            disabled={setupMut.isPending}
            onClick={() => (enabled ? setStep('disable') : setupMut.mutate())}
          >
            {enabled
              ? t('profilePage.twoFactorDisableCta')
              : setupMut.isPending
                ? t('profilePage.twoFactorLoading')
                : t('profilePage.twoFactorEnableCta')}
          </Button>
        </>
      )}

      {step === 'setup' && qrCode && secret && (
        <div className="space-y-3">
          <p className="text-xs text-ase-muted">{t('profilePage.twoFactorScanHint')}</p>
          <img
            src={qrCode}
            alt={t('profilePage.twoFactorQrAlt') as string}
            className="h-40 w-40 rounded-lg border border-white/10 bg-white p-2"
          />
          <div>
            <span className="mb-1 block text-xs text-ase-muted">{t('profilePage.twoFactorManualHint')}</span>
            <code className="block break-all rounded-lg border border-white/10 bg-ase-bg2/50 px-3 py-2 text-xs text-ase-text">
              {secret}
            </code>
          </div>
          <div>
            <span className="mb-1 block text-xs text-ase-muted">{t('profilePage.twoFactorCodeLabel')}</span>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="rounded-xl border-white/10 bg-ase-bg2/50"
            />
          </div>
          {error ? <p className="text-sm text-ase-error">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={confirmMut.isPending || code.length !== 6}
              onClick={() => confirmMut.mutate()}
            >
              {confirmMut.isPending ? t('profilePage.twoFactorLoading') : t('profilePage.twoFactorConfirmCta')}
            </Button>
            <Button type="button" variant="ghost" onClick={resetState}>
              {t('profilePage.twoFactorCancel')}
            </Button>
          </div>
        </div>
      )}

      {step === 'disable' && (
        <div className="space-y-3">
          <p className="text-xs text-ase-muted">{t('profilePage.twoFactorDisableHint')}</p>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder={t('profilePage.twoFactorPasswordPlaceholder') as string}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border-white/10 bg-ase-bg2/50"
          />
          {error ? <p className="text-sm text-ase-error">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="danger"
              disabled={disableMut.isPending || !password}
              onClick={() => disableMut.mutate()}
            >
              {disableMut.isPending ? t('profilePage.twoFactorLoading') : t('profilePage.twoFactorDisableCta')}
            </Button>
            <Button type="button" variant="ghost" onClick={resetState}>
              {t('profilePage.twoFactorCancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
