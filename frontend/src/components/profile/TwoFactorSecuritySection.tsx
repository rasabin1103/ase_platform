import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import {
  confirmTwoFactorSetup,
  disableTwoFactor,
  regenerateTwoFactorRecoveryCodes,
  setupTwoFactor,
} from '../../api/auth.api'
import { useAuth } from '../../auth/AuthProvider'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { useI18n } from '../../i18n'

type Phase = 'idle' | 'setup' | 'recovery' | 'disable'

type Props = {
  twoFactorEnabled: boolean
}

export function TwoFactorSecuritySection({ twoFactorEnabled }: Props) {
  const { t } = useI18n()
  const { loadCurrentUser } = useAuth()
  const [phase, setPhase] = useState<Phase>('idle')
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [manualKey, setManualKey] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [setupCode, setSetupCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [disablePassword, setDisablePassword] = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [regenCode, setRegenCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!otpauthUrl) {
      setQrDataUrl(null)
      return
    }
    let active = true
    QRCode.toDataURL(otpauthUrl, { width: 220, margin: 2, color: { dark: '#e2e8f0', light: '#0f172a10' } })
      .then((url) => {
        if (active) setQrDataUrl(url)
      })
      .catch(() => {
        if (active) setQrDataUrl(null)
      })
    return () => {
      active = false
    }
  }, [otpauthUrl])

  const setupMut = useMutation({
    mutationFn: setupTwoFactor,
    onSuccess: (data) => {
      setError(null)
      setOtpauthUrl(data.otpauth_url)
      setManualKey(data.manual_key)
      setSetupCode('')
      setPhase('setup')
    },
    onError: () => setError(t('profilePage.twoFactorSetupError')),
  })

  const confirmMut = useMutation({
    mutationFn: () => confirmTwoFactorSetup(setupCode),
    onSuccess: async (data) => {
      setError(null)
      setRecoveryCodes(data.recovery_codes)
      setPhase('recovery')
      await loadCurrentUser()
    },
    onError: () => setError(t('profilePage.twoFactorCodeError')),
  })

  const disableMut = useMutation({
    mutationFn: () => disableTwoFactor({ password: disablePassword, code: disableCode }),
    onSuccess: async () => {
      setError(null)
      setPhase('idle')
      setDisablePassword('')
      setDisableCode('')
      setOtpauthUrl(null)
      setManualKey(null)
      await loadCurrentUser()
    },
    onError: () => setError(t('profilePage.twoFactorDisableError')),
  })

  const regenMut = useMutation({
    mutationFn: () => regenerateTwoFactorRecoveryCodes(regenCode),
    onSuccess: (data) => {
      setError(null)
      setRecoveryCodes(data.recovery_codes)
      setRegenCode('')
      setPhase('recovery')
    },
    onError: () => setError(t('profilePage.twoFactorCodeError')),
  })

  if (twoFactorEnabled && phase !== 'disable' && phase !== 'recovery') {
    return (
      <div className="lg:col-span-2 lg:border-t lg:border-white/10 lg:pt-6">
        <Card className="rounded-2xl border-white/10 bg-ase-surface/60 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-ase-text">{t('profilePage.twoFactor')}</span>
            <Badge variant="success">{t('profilePage.twoFactorEnabled')}</Badge>
          </div>
          <p className="text-xs text-ase-muted">{t('profilePage.twoFactorActiveHint')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setPhase('disable')}>
              {t('profilePage.twoFactorDisable')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setRegenCode('')
                setPhase('recovery')
              }}
            >
              {t('profilePage.twoFactorRegenCodes')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'recovery' && recoveryCodes.length > 0) {
    return (
      <div className="lg:col-span-2 lg:border-t lg:border-white/10 lg:pt-6">
        <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 p-5">
          <h3 className="text-sm font-semibold text-amber-100">{t('profilePage.twoFactorRecoveryTitle')}</h3>
          <p className="mt-2 text-xs text-ase-muted">{t('profilePage.twoFactorRecoveryWarning')}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {recoveryCodes.map((code) => (
              <li
                key={code}
                className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-sm tracking-wider text-emerald-100"
              >
                {code}
              </li>
            ))}
          </ul>
          <Button type="button" className="mt-5" onClick={() => setPhase('idle')}>
            {t('profilePage.twoFactorRecoveryDone')}
          </Button>
        </Card>
      </div>
    )
  }

  if (phase === 'disable') {
    return (
      <div className="lg:col-span-2 lg:border-t lg:border-white/10 lg:pt-6">
        <Card className="rounded-2xl border-white/10 bg-ase-surface/60 p-5">
          <h3 className="text-sm font-semibold text-ase-text">{t('profilePage.twoFactorDisable')}</h3>
          <p className="mt-1 text-xs text-ase-muted">{t('profilePage.twoFactorDisableHint')}</p>
          <div className="mt-4 space-y-3 max-w-md">
            <div>
              <label className="mb-1 block text-xs text-ase-muted">{t('profilePage.twoFactorPassword')}</label>
              <Input
                type="password"
                autoComplete="current-password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ase-muted">{t('profilePage.twoFactorCodeLabel')}</label>
              <Input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-ase-error">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={disableMut.isPending}
              onClick={() => disableMut.mutate()}
            >
              {disableMut.isPending ? t('profilePage.twoFactorDisabling') : t('profilePage.twoFactorConfirmDisable')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setPhase('idle')}>
              {t('profilePage.cancelVerify')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (phase === 'setup') {
    return (
      <div className="lg:col-span-2 lg:border-t lg:border-white/10 lg:pt-6">
        <Card className="rounded-2xl border-white/10 bg-ase-surface/60 p-5">
          <p className="text-xs text-ase-muted">{t('profilePage.twoFactorIntro')}</p>
          <ol className="mt-4 space-y-3 text-sm text-ase-text">
            <li>
              <span className="font-semibold text-cyan-300">1.</span> {t('profilePage.twoFactorStep1')}
            </li>
            <li>
              <span className="font-semibold text-cyan-300">2.</span> {t('profilePage.twoFactorStep2')}
            </li>
            <li>
              <span className="font-semibold text-cyan-300">3.</span> {t('profilePage.twoFactorStep3')}
            </li>
            <li>
              <span className="font-semibold text-cyan-300">4.</span> {t('profilePage.twoFactorStep4')}
            </li>
          </ol>

          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={t('profilePage.twoFactorQrAlt')}
                className="rounded-xl border border-white/10 bg-white/5 p-2"
                width={220}
                height={220}
              />
            ) : (
              <div className="flex h-[220px] w-[220px] items-center justify-center rounded-xl border border-white/10 text-xs text-ase-muted">
                {t('profilePage.twoFactorQrLoading')}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ase-muted">{t('profilePage.twoFactorManualKey')}</p>
              <p className="mt-1 break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-cyan-100">
                {manualKey}
              </p>
            </div>
          </div>

          <div className="mt-6 max-w-xs">
            <label className="mb-1 block text-xs text-ase-muted">{t('profilePage.twoFactorCodeLabel')}</label>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              placeholder="000000"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          {error ? <p className="mt-3 text-sm text-ase-error">{error}</p> : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={setupCode.length < 6 || confirmMut.isPending}
              onClick={() => confirmMut.mutate()}
            >
              {confirmMut.isPending ? t('profilePage.twoFactorConfirming') : t('profilePage.twoFactorConfirm')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setPhase('idle')}>
              {t('profilePage.cancelVerify')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (twoFactorEnabled && phase === 'recovery' && recoveryCodes.length === 0) {
    return (
      <div className="lg:col-span-2 lg:border-t lg:border-white/10 lg:pt-6">
        <Card className="rounded-2xl border-white/10 bg-ase-surface/60 p-5">
          <p className="text-xs text-ase-muted">{t('profilePage.twoFactorRegenHint')}</p>
          <div className="mt-3 max-w-xs">
            <Input
              inputMode="numeric"
              maxLength={8}
              placeholder="000000"
              value={regenCode}
              onChange={(e) => setRegenCode(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          {error ? <p className="mt-2 text-sm text-ase-error">{error}</p> : null}
          <Button
            type="button"
            className="mt-3"
            disabled={regenCode.length < 6 || regenMut.isPending}
            onClick={() => regenMut.mutate()}
          >
            {regenMut.isPending ? t('profilePage.twoFactorConfirming') : t('profilePage.twoFactorRegenCodes')}
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="lg:col-span-2 lg:border-t lg:border-white/10 lg:pt-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-ase-text">{t('profilePage.twoFactor')}</span>
        <Badge variant="default">{t('profilePage.twoFactorDisabled')}</Badge>
      </div>
      <p className="text-xs text-ase-muted">{t('profilePage.twoFactorIntro')}</p>
      {error ? <p className="mt-2 text-sm text-ase-error">{error}</p> : null}
      <Button
        type="button"
        variant="outline"
        className="mt-3"
        disabled={setupMut.isPending}
        onClick={() => setupMut.mutate()}
      >
        {setupMut.isPending ? t('profilePage.twoFactorSettingUp') : t('profilePage.twoFactorEnable')}
      </Button>
    </div>
  )
}
