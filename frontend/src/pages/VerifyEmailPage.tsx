import { useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { confirmEmailVerification } from '../api/auth.api'
import { AuthCard } from '../components/public/AuthCard'
import { AuthVisualPanel } from '../components/public/AuthVisualPanel'
import { useI18n } from '../i18n'

export function VerifyEmailPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const attempted = useRef(false)

  const mutation = useMutation({
    mutationFn: () => confirmEmailVerification(token),
  })

  useEffect(() => {
    if (token && !attempted.current) {
      attempted.current = true
      mutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-16 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <AuthVisualPanel
          badge={t('auth.verifyEmail.badge')}
          title={t('auth.verifyEmail.title')}
          body={t('auth.verifyEmail.body')}
          bullets={t<string[]>('auth.bullets')}
        />

        <div className="flex items-center justify-center lg:justify-end">
          <AuthCard>
            {!token ? (
              <div className="space-y-4">
                <div className="text-lg font-bold text-ase-text">{t('auth.verifyEmail.invalidTitle')}</div>
                <p className="text-sm text-ase-text2">{t('auth.verifyEmail.invalidBody')}</p>
              </div>
            ) : mutation.isPending || mutation.isIdle ? (
              <div className="space-y-4">
                <div className="text-lg font-bold text-ase-text">{t('auth.verifyEmail.pendingTitle')}</div>
                <p className="text-sm text-ase-text2">{t('auth.verifyEmail.pendingBody')}</p>
              </div>
            ) : mutation.isSuccess ? (
              <div className="space-y-4">
                <div className="text-lg font-bold text-ase-text">{t('auth.verifyEmail.doneTitle')}</div>
                <p className="text-sm text-ase-text2">{t('auth.verifyEmail.doneBody')}</p>
                <Link
                  to="/login"
                  className="inline-block text-sm font-medium text-ase-text underline decoration-white/20 hover:decoration-white/50"
                >
                  {t('auth.backToLogin')}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-lg font-bold text-ase-text">{t('auth.verifyEmail.errorTitle')}</div>
                <p className="text-sm text-ase-text2">{t('auth.verifyEmail.errorBody')}</p>
                <Link
                  to="/login"
                  className="inline-block text-sm font-medium text-ase-text underline decoration-white/20 hover:decoration-white/50"
                >
                  {t('auth.backToLogin')}
                </Link>
              </div>
            )}
          </AuthCard>
        </div>
      </div>
    </div>
  )
}
