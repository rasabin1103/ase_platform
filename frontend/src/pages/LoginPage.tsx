import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import axios from 'axios'
import { confirmTwoFactorLogin, isLoginRequires2FA, login } from '../api/auth.api'
import { getAccessToken } from '../auth/auth.store'
import { clearSecurityWarningDismissedSession } from '../auth/securityOnboardingSession'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { API_BASE_URL } from '../api/client'
import { authDebugLog } from '../utils/authDebugLog'
import { AuthCard } from '../components/public/AuthCard'
import { AuthVisualPanel } from '../components/public/AuthVisualPanel'
import { useI18n } from '../i18n'
import { useAuth } from '../hooks/useAuth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const auth = useAuth()
  const [pending2faToken, setPending2faToken] = useState<string | null>(null)
  const [totpCode, setTotpCode] = useState('')
  const [twoFaError, setTwoFaError] = useState<string | null>(null)

  useEffect(() => {
    const token = getAccessToken()
    if (token) navigate('/dashboard', { replace: true })
  }, [navigate])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const finishLogin = async (access_token: string, refresh_token: string, email: string) => {
    clearSecurityWarningDismissedSession()
    authDebugLog('login_success', { email, apiBase: API_BASE_URL || '(empty)' })
    await auth.login({ access_token, refresh_token })
    authDebugLog('redirecting_to_dashboard', { email })
    navigate('/dashboard', { replace: true })
  }

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (data, variables) => {
      if (isLoginRequires2FA(data)) {
        setPending2faToken(data.temporary_login_token)
        setTotpCode('')
        setTwoFaError(null)
        return
      }
      try {
        await finishLogin(data.access_token, data.refresh_token, variables.email)
      } catch {
        authDebugLog('post_login_bootstrap_failed', { email: variables.email })
        throw new Error('SESSION_BOOTSTRAP_FAILED')
      }
    },
  })

  const twoFaMut = useMutation({
    mutationFn: () => {
      if (!pending2faToken) throw new Error('MISSING_2FA_TOKEN')
      return confirmTwoFactorLogin({ temporary_login_token: pending2faToken, code: totpCode })
    },
    onSuccess: async (data) => {
      setTwoFaError(null)
      try {
        await finishLogin(data.access_token, data.refresh_token, form.getValues('email'))
      } catch {
        throw new Error('SESSION_BOOTSTRAP_FAILED')
      }
    },
    onError: (err) => {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setTwoFaError(t('auth.login.twoFactorInvalid'))
      } else if (axios.isAxiosError(err) && err.response?.status === 429) {
        setTwoFaError(t('auth.login.twoFactorRateLimit'))
      } else {
        setTwoFaError(t('auth.login.twoFactorError'))
      }
    },
  })

  const show2fa = Boolean(pending2faToken)

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-16 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <AuthVisualPanel
          badge={t('auth.login.badge')}
          title={show2fa ? t('auth.login.twoFactorTitle') : t('auth.login.title')}
          body={show2fa ? t('auth.login.twoFactorBody') : t('auth.login.body')}
          bullets={t('auth.bullets')}
        />

        <div className="flex items-center justify-center lg:justify-end">
          <AuthCard>
            <div className="mb-6">
              <div className="text-lg font-bold text-ase-text">
                {show2fa ? t('auth.login.twoFactorFormTitle') : t('auth.login.formTitle')}
              </div>
              <div className="mt-1 text-sm text-ase-text2">
                {show2fa ? t('auth.login.twoFactorFormSubtitle') : t('auth.login.formSubtitle')}
              </div>
            </div>

            {show2fa ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">
                    {t('auth.login.twoFactorCodeLabel')}
                  </label>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={8}
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                {twoFaError ? (
                  <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                    {twoFaError}
                  </div>
                ) : null}
                <Button
                  size="lg"
                  type="button"
                  className="w-full"
                  disabled={totpCode.length < 6 || twoFaMut.isPending}
                  onClick={() => twoFaMut.mutate()}
                >
                  {twoFaMut.isPending ? t('auth.login.twoFactorLoading') : t('auth.login.twoFactorSubmit')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setPending2faToken(null)
                    setTotpCode('')
                    setTwoFaError(null)
                  }}
                >
                  {t('auth.login.twoFactorBack')}
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">Email</label>
                  <Input type="email" autoComplete="email" placeholder="name@company.com" {...form.register('email')} />
                  {form.formState.errors.email && (
                    <p className="mt-1 text-sm text-ase-error">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">Password</label>
                  <Input type="password" autoComplete="current-password" {...form.register('password')} />
                  {form.formState.errors.password && (
                    <p className="mt-1 text-sm text-ase-error">{form.formState.errors.password.message}</p>
                  )}
                </div>

                {mutation.isError && (
                  <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                    {(() => {
                      if (mutation.error instanceof Error && mutation.error.message === 'SESSION_BOOTSTRAP_FAILED') {
                        return 'Sesión creada pero no se pudo cargar tu usuario (GET /auth/me). Revisa la consola y VITE_API_URL.'
                      }
                      if (axios.isAxiosError(mutation.error)) {
                        const status = mutation.error.response?.status
                        const url = String(mutation.error.config?.url ?? '')
                        if (status === 401 && url.includes('/auth/me')) {
                          return 'Token recibido pero no válido para /auth/me. Comprueba JWT_SECRET_KEY en backend y que VITE_API_URL apunte al mismo API.'
                        }
                        if (status === 401) return 'Credenciales inválidas.'
                        if (!mutation.error.response)
                          return `No se pudo conectar con el backend (CORS / API caída). VITE_API_URL=${API_BASE_URL || '(vacío)'}`
                        return `Error al iniciar sesión (HTTP ${status}).`
                      }
                      return 'Error al iniciar sesión.'
                    })()}
                  </div>
                )}

                <Button size="lg" type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending ? t('auth.login.loading') : t('auth.login.submit')}
                </Button>

                <div className="flex flex-col gap-3 pt-2 text-center text-sm text-ase-text2">
                  <p>
                    {t('auth.login.noAccount')}{' '}
                    <Link
                      to="/register"
                      className="font-medium text-ase-text underline decoration-white/20 hover:decoration-white/50"
                    >
                      {t('auth.login.createAccount')}
                    </Link>
                  </p>
                  <p>
                    <Link
                      to="/"
                      className="text-ase-text2 hover:text-ase-text underline decoration-white/10 hover:decoration-white/30"
                    >
                      {t('auth.backHome')}
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </AuthCard>
        </div>
      </div>
    </div>
  )
}
