import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { confirmEmailVerificationPost } from '../api/auth.api'
import { useAuth } from '../auth/AuthProvider'
import { getAccessToken } from '../auth/auth.store'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { useI18n } from '../i18n'

type VerifyStatus = 'loading' | 'success' | 'error'

export function EmailVerifyPage() {
  const { t } = useI18n()
  const { loadCurrentUser } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = useMemo(() => params.get('token')?.trim() ?? '', [params])

  const [status, setStatus] = useState<VerifyStatus | null>(null)
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null)
  const [errorKind, setErrorKind] = useState<'failed' | 'already_used'>('failed')

  useEffect(() => {
    if (!token) {
      setStatus(null)
      return
    }

    let active = true
    setStatus('loading')
    setVerifiedEmail(null)
    setErrorKind('failed')

    confirmEmailVerificationPost(token)
      .then((data) => {
        if (!active) return
        setVerifiedEmail(data.email)
        setStatus('success')
        if (getAccessToken()) {
          void loadCurrentUser()
        }
      })
      .catch((err: unknown) => {
        if (!active) return
        const detail = isAxiosError(err)
          ? (err.response?.data as { detail?: string } | undefined)?.detail
          : undefined
        setErrorKind(detail === 'Verification link already used' ? 'already_used' : 'failed')
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [token, loadCurrentUser])

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="rounded-2xl border-white/10 bg-ase-surface/80 p-6 text-center">
          <p className="text-ase-error">{t('profilePage.emailVerifyInvalid')}</p>
          <Button className="mt-4" variant="secondary" onClick={() => navigate('/login')}>
            {t('profilePage.backToLogin')}
          </Button>
        </Card>
      </div>
    )
  }

  if (status === 'loading' || status === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div
          className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400"
          aria-hidden
        />
        <p className="text-ase-muted">{t('profilePage.emailVerifyPending')}</p>
      </div>
    )
  }

  if (status === 'error') {
    const message =
      errorKind === 'already_used'
        ? t('profilePage.emailVerifyAlreadyUsed')
        : t('profilePage.emailVerifyFailed')

    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="rounded-2xl border-white/10 bg-ase-surface/80 p-6 text-center">
          <p className="text-ase-error">{message}</p>
          <Link to="/profile" className="mt-4 inline-block text-cyan-300 hover:underline">
            {t('profilePage.backToProfile')}
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Card className="rounded-2xl border-white/10 bg-ase-surface/80 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-200">{t('profilePage.emailVerifySuccess')}</p>
        {verifiedEmail ? <p className="mt-2 text-sm text-ase-muted">{verifiedEmail}</p> : null}
        <Button className="mt-6" onClick={() => navigate('/profile')}>
          {t('profilePage.backToProfile')}
        </Button>
      </Card>
    </div>
  )
}
