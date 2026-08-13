import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { login, verifyLoginTwoFactor } from '../api/auth.api'
import { getAccessToken } from '../auth/auth.store'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import axios from 'axios'
import { API_BASE_URL } from '../api/client'
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
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [otpCode, setOtpCode] = useState('')

  useEffect(() => {
    const token = getAccessToken()
    if (token) navigate('/dashboard', { replace: true })
  }, [navigate])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      if ('two_factor_required' in data) {
        setChallengeToken(data.challenge_token)
        return
      }
      await auth.login({ access_token: data.access_token, refresh_token: data.refresh_token })
      navigate('/dashboard', { replace: true })
    },
  })

  const otpMutation = useMutation({
    mutationFn: () => verifyLoginTwoFactor(challengeToken as string, otpCode),
    onSuccess: async (data) => {
      await auth.login({ access_token: data.access_token, refresh_token: data.refresh_token })
      navigate('/dashboard', { replace: true })
    },
  })

  if (challengeToken) {
    return (
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <AuthVisualPanel
            badge={t('auth.login.badge')}
            title={t('auth.login.title')}
            body={t('auth.login.body')}
            bullets={t<string[]>('auth.bullets')}
          />
          <div className="flex items-center justify-center lg:justify-end">
            <AuthCard>
              <div className="mb-6">
                <div className="text-lg font-bold text-ase-text">{t('auth.login.twoFactorTitle')}</div>
                <div className="mt-1 text-sm text-ase-text2">{t('auth.login.twoFactorBody')}</div>
              </div>

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  otpMutation.mutate()
                }}
              >
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">
                    {t('auth.login.twoFactorCodeLabel')}
                  </label>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                  />
                </div>

                {otpMutation.isError && (
                  <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                    {t('auth.login.twoFactorError')}
                  </div>
                )}

                <Button
                  size="lg"
                  type="submit"
                  className="w-full"
                  disabled={otpMutation.isPending || otpCode.length !== 6}
                >
                  {otpMutation.isPending ? t('auth.login.loading') : t('auth.login.twoFactorSubmit')}
                </Button>

                <button
                  type="button"
                  className="w-full text-center text-sm text-ase-text2 underline decoration-white/10 hover:text-ase-text hover:decoration-white/30"
                  onClick={() => {
                    setChallengeToken(null)
                    setOtpCode('')
                  }}
                >
                  {t('auth.login.twoFactorBack')}
                </button>
              </form>
            </AuthCard>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-16 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <AuthVisualPanel
          badge={t('auth.login.badge')}
          title={t('auth.login.title')}
          body={t('auth.login.body')}
          bullets={t<string[]>('auth.bullets')}
        />

        <div className="flex items-center justify-center lg:justify-end">
          <AuthCard>
            <div className="mb-6">
              <div className="text-lg font-bold text-ase-text">{t('auth.login.formTitle')}</div>
              <div className="mt-1 text-sm text-ase-text2">{t('auth.login.formSubtitle')}</div>
            </div>

            <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">Email</label>
                <Input type="email" autoComplete="email" placeholder="name@company.com" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="mt-1 text-sm text-ase-error">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-medium text-ase-muted">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-ase-text2 underline decoration-white/10 hover:text-ase-text hover:decoration-white/30"
                  >
                    {t('auth.login.forgotPassword')}
                  </Link>
                </div>
                <Input type="password" autoComplete="current-password" {...form.register('password')} />
                {form.formState.errors.password && (
                  <p className="mt-1 text-sm text-ase-error">{form.formState.errors.password.message}</p>
                )}
              </div>

              {mutation.isError && (
                <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                  {(() => {
                    if (axios.isAxiosError(mutation.error)) {
                      const status = mutation.error.response?.status
                      if (status === 401) return 'Credenciales inválidas.'
                      if (status === 423) {
                        const retryAfter = Number(mutation.error.response?.headers?.['retry-after'])
                        const minutes = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter / 60) : null
                        return minutes
                          ? String(t('auth.login.lockedError')).replace('{{minutes}}', String(minutes))
                          : t('auth.login.lockedErrorGeneric')
                      }
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
                  <Link to="/" className="text-ase-text2 hover:text-ase-text underline decoration-white/10 hover:decoration-white/30">
                    {t('auth.backHome')}
                  </Link>
                </p>
              </div>
            </form>
          </AuthCard>
        </div>
      </div>
    </div>
  )
}

