import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { confirmNewsletterUnsubscribe } from '../api/newsletter.api'
import { AuthCard } from '../components/public/AuthCard'
import { AuthVisualPanel } from '../components/public/AuthVisualPanel'
import { useI18n } from '../i18n'

type UnsubscribeStatus = 'pending' | 'success' | 'error'

export function NewsletterUnsubscribePage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const attempted = useRef(false)
  // Same plain-state pattern as VerifyEmailPage: a one-shot request guarded
  // by `attempted`, so there's no value in useMutation's retry/cache
  // machinery here — a bare useState is simpler to reason about.
  const [status, setStatus] = useState<UnsubscribeStatus>('pending')

  useEffect(() => {
    if (!token || attempted.current) return
    attempted.current = true
    confirmNewsletterUnsubscribe(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-16 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <AuthVisualPanel
          badge={t('auth.newsletterUnsubscribe.badge')}
          title={t('auth.newsletterUnsubscribe.title')}
          body={t('auth.newsletterUnsubscribe.body')}
          bullets={t<string[]>('auth.bullets')}
        />

        <div className="flex items-center justify-center lg:justify-end">
          <AuthCard>
            {!token ? (
              <div className="space-y-4">
                <AlertCircle className="h-10 w-10 text-amber-400" strokeWidth={1.75} />
                <div className="text-lg font-bold text-ase-text">{t('auth.newsletterUnsubscribe.invalidTitle')}</div>
                <p className="text-sm text-ase-text2">{t('auth.newsletterUnsubscribe.invalidBody')}</p>
              </div>
            ) : status === 'pending' ? (
              <div className="space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-ase-primary" strokeWidth={1.75} />
                <div className="text-lg font-bold text-ase-text">{t('auth.newsletterUnsubscribe.pendingTitle')}</div>
                <p className="text-sm text-ase-text2">{t('auth.newsletterUnsubscribe.pendingBody')}</p>
              </div>
            ) : status === 'success' ? (
              <div className="space-y-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" strokeWidth={1.75} />
                <div className="text-lg font-bold text-ase-text">{t('auth.newsletterUnsubscribe.doneTitle')}</div>
                <p className="text-sm text-ase-text2">{t('auth.newsletterUnsubscribe.doneBody')}</p>
                <Link
                  to="/login"
                  className="inline-block text-sm font-medium text-ase-text underline decoration-white/20 hover:decoration-white/50"
                >
                  {t('auth.backToLogin')}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <XCircle className="h-10 w-10 text-rose-400" strokeWidth={1.75} />
                <div className="text-lg font-bold text-ase-text">{t('auth.newsletterUnsubscribe.errorTitle')}</div>
                <p className="text-sm text-ase-text2">{t('auth.newsletterUnsubscribe.errorBody')}</p>
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
