import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { login } from '../api/auth.api'
import { getAccessToken } from '../auth/auth.store'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import axios from 'axios'
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
    onSuccess: async (data, variables) => {
      authDebugLog('login_success', { email: variables.email, apiBase: API_BASE_URL || '(empty)' })
      try {
        await auth.login({ access_token: data.access_token, refresh_token: data.refresh_token })
        authDebugLog('redirecting_to_dashboard', { email: variables.email })
        navigate('/dashboard', { replace: true })
      } catch {
        authDebugLog('post_login_bootstrap_failed', { email: variables.email })
        throw new Error('SESSION_BOOTSTRAP_FAILED')
      }
    },
  })

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-16 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <AuthVisualPanel
          badge={t('auth.login.badge')}
          title={t('auth.login.title')}
          body={t('auth.login.body')}
          bullets={t('auth.bullets')}
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

