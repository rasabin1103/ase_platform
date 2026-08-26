import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import axios from 'axios'
import { confirmPasswordReset } from '../api/auth.api'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { AuthCard } from '../components/public/AuthCard'
import { AuthVisualPanel } from '../components/public/AuthVisualPanel'
import { useI18n } from '../i18n'
import { passwordSchema } from '../utils/passwordPolicy'

function buildSchema(t: (key: string) => unknown) {
  const password = passwordSchema({
    tooShort: t('password.tooShort') as string,
    tooLong: t('password.tooLong') as string,
    weak: t('password.weak') as string,
  })
  return z
    .object({
      new_password: password,
      confirm_password: password,
    })
    .refine((values) => values.new_password === values.confirm_password, {
      path: ['confirm_password'],
      message: 'mismatch',
    })
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>

export function ResetPasswordPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const form = useForm<FormValues>({
    resolver: zodResolver(buildSchema(t)),
    defaultValues: { new_password: '', confirm_password: '' },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => confirmPasswordReset(token, values.new_password),
  })

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-8 py-16 sm:py-20">
      <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <AuthVisualPanel
          badge={t('auth.resetPassword.badge')}
          title={t('auth.resetPassword.title')}
          body={t('auth.resetPassword.body')}
          bullets={t<string[]>('auth.bullets')}
        />

        <div className="flex items-center justify-center lg:justify-end">
          <AuthCard>
            {!token ? (
              <div className="space-y-4">
                <div className="text-lg font-bold text-ase-text">{t('auth.resetPassword.invalidTitle')}</div>
                <p className="text-sm text-ase-text2">{t('auth.resetPassword.invalidBody')}</p>
                <Link
                  to="/forgot-password"
                  className="inline-block text-sm font-medium text-ase-text underline decoration-white/20 hover:decoration-white/50"
                >
                  {t('auth.forgotPassword.formTitle')}
                </Link>
              </div>
            ) : mutation.isSuccess ? (
              <div className="space-y-4">
                <div className="text-lg font-bold text-ase-text">{t('auth.resetPassword.doneTitle')}</div>
                <p className="text-sm text-ase-text2">{t('auth.resetPassword.doneBody')}</p>
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
                  <div className="text-lg font-bold text-ase-text">{t('auth.resetPassword.formTitle')}</div>
                  <div className="mt-1 text-sm text-ase-text2">{t('auth.resetPassword.formSubtitle')}</div>
                </div>

                <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
                  <div>
                    <label htmlFor="reset-password-new" className="mb-1 block text-xs font-medium text-ase-muted">{t('auth.resetPassword.newPassword')}</label>
                    <Input id="reset-password-new" type="password" autoComplete="new-password" {...form.register('new_password')} />
                    {form.formState.errors.new_password ? (
                      <p className="mt-1 text-sm text-ase-error">{form.formState.errors.new_password.message}</p>
                    ) : (
                      <p className="mt-1 text-xs text-ase-muted">{t('password.hint') as string}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="reset-password-confirm" className="mb-1 block text-xs font-medium text-ase-muted">{t('auth.resetPassword.confirmPassword')}</label>
                    <Input id="reset-password-confirm" type="password" autoComplete="new-password" {...form.register('confirm_password')} />
                    {form.formState.errors.confirm_password && (
                      <p className="mt-1 text-sm text-ase-error">{t('auth.resetPassword.mismatch')}</p>
                    )}
                  </div>

                  {mutation.isError && (
                    <div className="rounded-lg border border-ase-error/30 bg-ase-error/10 p-3 text-sm text-ase-error">
                      {axios.isAxiosError(mutation.error) && mutation.error.response?.status === 400
                        ? t('auth.resetPassword.expiredError')
                        : t('auth.resetPassword.genericError')}
                    </div>
                  )}

                  <Button size="lg" type="submit" className="w-full" disabled={mutation.isPending}>
                    {mutation.isPending ? t('auth.resetPassword.loading') : t('auth.resetPassword.submit')}
                  </Button>
                </form>
              </>
            )}
          </AuthCard>
        </div>
      </div>
    </div>
  )
}
