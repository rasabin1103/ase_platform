import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { requestPasswordReset } from '../api/auth.api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AuthCard } from '../components/public/AuthCard'
import { AuthVisualPanel } from '../components/public/AuthVisualPanel'
import { useI18n } from '../i18n'

const schema = z.object({ email: z.string().email() })
type FormValues = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { t } = useI18n()

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => requestPasswordReset(values.email),
  })

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-16 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <AuthVisualPanel
          badge={t('auth.forgotPassword.badge')}
          title={t('auth.forgotPassword.title')}
          body={t('auth.forgotPassword.body')}
          bullets={t<string[]>('auth.bullets')}
        />

        <div className="flex items-center justify-center lg:justify-end">
          <AuthCard>
            {mutation.isSuccess ? (
              <div className="space-y-4">
                <div className="text-lg font-bold text-ase-text">{t('auth.forgotPassword.sentTitle')}</div>
                <p className="text-sm text-ase-text2">{t('auth.forgotPassword.sentBody')}</p>
                <Link
                  to="/login"
                  className="inline-block text-sm font-medium text-ase-text underline decoration-white/20 hover:decoration-white/50"
                >
                  {t('auth.backToLogin')}
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-lg font-bold text-ase-text">{t('auth.forgotPassword.formTitle')}</div>
                  <div className="mt-1 text-sm text-ase-text2">{t('auth.forgotPassword.formSubtitle')}</div>
                </div>

                <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <div>
                    <label htmlFor="forgot-password-email" className="mb-1 block text-xs font-medium text-ase-muted">Email</label>
                    <Input id="forgot-password-email" type="email" autoComplete="email" placeholder="name@company.com" {...form.register('email')} />
                    {form.formState.errors.email && (
                      <p className="mt-1 text-sm text-ase-error">{form.formState.errors.email.message}</p>
                    )}
                  </div>

                  <Button size="lg" type="submit" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? t('auth.forgotPassword.loading') : t('auth.forgotPassword.submit')}
                  </Button>

                  <div className="flex flex-col gap-3 pt-2 text-center text-sm text-ase-text2">
                    <p>
                      <Link
                        to="/login"
                        className="font-medium text-ase-text underline decoration-white/20 hover:decoration-white/50"
                      >
                        {t('auth.backToLogin')}
                      </Link>
                    </p>
                  </div>
                </form>
              </>
            )}
          </AuthCard>
        </div>
      </div>
    </div>
  )
}
