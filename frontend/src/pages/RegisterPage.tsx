import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { isLoginRequires2FA, login, register } from '../api/auth.api'
import { getAccessToken } from '../auth/auth.store'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AuthCard } from '../components/public/AuthCard'
import { AuthVisualPanel } from '../components/public/AuthVisualPanel'
import { useI18n } from '../i18n'
import { useAuth } from '../hooks/useAuth'

const schema = z.object({
  email: z.string().email(),
  plain_password: z.string().min(8),
  first_name: z.string().max(100).optional().or(z.literal('')),
  last_name: z.string().max(100).optional().or(z.literal('')),
  display_name: z.string().max(150).optional().or(z.literal('')),
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const auth = useAuth()

  useEffect(() => {
    const token = getAccessToken()
    if (token) navigate('/dashboard', { replace: true })
  }, [navigate])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', plain_password: '', first_name: '', last_name: '', display_name: '' },
  })

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      await register({
        email: values.email,
        plain_password: values.plain_password,
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        display_name: values.display_name || null,
      })
      const loginResult = await login({ email: values.email, password: values.plain_password })
      if (isLoginRequires2FA(loginResult)) {
        throw new Error('UNEXPECTED_2FA_AFTER_REGISTER')
      }
      await auth.login(loginResult)
    },
    onSuccess: () => {
      navigate('/dashboard', { replace: true })
    },
  })

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-16 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <AuthVisualPanel
          badge={t('auth.register.badge')}
          title={t('auth.register.title')}
          body={t('auth.register.body')}
          bullets={t('auth.bullets')}
        />

        <div className="flex items-center justify-center lg:justify-end">
          <AuthCard>
            <div className="mb-6">
              <div className="text-lg font-bold text-ase-text">{t('auth.register.formTitle')}</div>
              <div className="mt-1 text-sm text-ase-text2">{t('auth.register.formSubtitle')}</div>
            </div>

            <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">Display name</label>
                <Input autoComplete="nickname" placeholder="Roberto Arce" {...form.register('display_name')} />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">Email</label>
                <Input type="email" autoComplete="email" placeholder="name@company.com" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="mt-1 text-sm text-ase-error">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-ase-muted">Password</label>
                <Input type="password" autoComplete="new-password" {...form.register('plain_password')} />
                {form.formState.errors.plain_password && (
                  <p className="mt-1 text-sm text-ase-error">{form.formState.errors.plain_password.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">First name</label>
                  <Input autoComplete="given-name" {...form.register('first_name')} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ase-muted">Last name</label>
                  <Input autoComplete="family-name" {...form.register('last_name')} />
                </div>
              </div>

              {mutation.isError && (
                <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                  Error al registrarse. Revisa el backend.
                </div>
              )}

              <Button size="lg" type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? t('auth.register.loading') : t('auth.register.submit')}
              </Button>

              <div className="flex flex-col gap-3 pt-2 text-center text-sm text-ase-text2">
                <p>
                  {t('auth.register.haveAccount')}{' '}
                  <Link
                    to="/login"
                    className="font-medium text-ase-text underline decoration-white/20 hover:decoration-white/50"
                  >
                    {t('auth.register.login')}
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

