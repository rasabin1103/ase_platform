import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { Card } from '../../components/ui/Card'
import { Button, ButtonAnchor } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { TurnstileWidget } from '../../components/auth/TurnstileWidget'
import { submitContactMessage } from '../../api/plansCatalog.api'
import { useI18n } from '../../i18n'
import { usePageTitle } from '../../hooks/usePageTitle'

type ContactValues = {
  name: string
  email: string
  company: string
  message: string
}

export function ContactPage() {
  const [values, setValues] = useState<ContactValues>({ name: '', email: '', company: '', message: '' })
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const { t, language } = useI18n()
  usePageTitle(t('pages.contact.title') as string, t('pages.contact.body') as string)

  const mutation = useMutation({
    mutationFn: () =>
      submitContactMessage({
        name: values.name,
        email: values.email,
        company: values.company || undefined,
        message: values.message,
        language,
        turnstile_token: turnstileToken,
      }),
    onSuccess: () => setValues({ name: '', email: '', company: '', message: '' }),
  })

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14">
      <Eyebrow>{t('pages.contact.badge')}</Eyebrow>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
        {t('pages.contact.title')}
      </h1>
      <p className="mt-4 max-w-3xl text-base text-ase-text2">
        {t('pages.contact.body')}
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2" interactive>
          <div className="text-sm font-semibold text-ase-text">{t('pages.contact.sendTitle')}</div>
          <div className="mt-1 text-sm text-ase-text2">{t('pages.contact.sendSubtitle')}</div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {(['trust1', 'trust2', 'trust3'] as const).map((key) => (
              <div key={key} className="inline-flex items-center gap-2 text-sm text-ase-text2">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ase-brand/30 bg-ase-brand/10 text-[11px] font-bold text-ase-brand"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span>{t(`pages.contact.${key}`)}</span>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              mutation.mutate()
            }}
          >
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-1 block text-xs font-medium text-ase-muted">{t('pages.contact.fields.name')}</label>
                <Input
                  id="contact-name"
                  required
                  value={values.name}
                  onChange={(e) => setValues((v) => ({ ...v, name: String(e.target.value ?? '') }))}
                  placeholder={String(t('pages.contact.fields.namePh'))}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-1 block text-xs font-medium text-ase-muted">{t('pages.contact.fields.email')}</label>
                <Input
                  id="contact-email"
                  type="email"
                  required
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: String(e.target.value ?? '') }))}
                  placeholder="name@company.com"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-company" className="mb-1 block text-xs font-medium text-ase-muted">{t('pages.contact.fields.company')}</label>
                <Input
                  id="contact-company"
                  value={values.company}
                  onChange={(e) => setValues((v) => ({ ...v, company: String(e.target.value ?? '') }))}
                  placeholder={String(t('pages.contact.fields.companyPh'))}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contact-message" className="mb-1 block text-xs font-medium text-ase-muted">{t('pages.contact.fields.message')}</label>
                <textarea
                  id="contact-message"
                  required
                  className="min-h-32 w-full resize-none rounded-md border border-ase-border bg-ase-surface px-3 py-2 text-sm text-ase-text outline-none transition focus-visible:border-ase-primary/60 focus-visible:ring-2 focus-visible:ring-ase-accent/30"
                  value={values.message}
                  onChange={(e) => setValues((v) => ({ ...v, message: String(e.target.value ?? '') }))}
                  placeholder={String(t('pages.contact.fields.messagePh'))}
                />
              </div>
            </div>

            <div className="mt-3">
              <TurnstileWidget onVerify={setTurnstileToken} />
            </div>

            {mutation.isSuccess ? (
              <p role="status" className="mt-4 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                {t('pages.contact.submitSuccess')}
              </p>
            ) : null}
            {mutation.isError ? (
              <p role="alert" className="mt-4 rounded-lg border border-ase-error/30 bg-ase-error/10 px-3 py-2 text-sm text-ase-error">
                {t('pages.contact.submitError')}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button type="submit" className="w-full sm:w-auto" disabled={mutation.isPending}>
                {mutation.isPending ? t('pages.contact.submitting') : t('pages.contact.submit')}
              </Button>
              <ButtonAnchor
                href="mailto:contact@arcesabinengineering.com"
                variant="secondary"
                className="w-full sm:w-auto"
              >
                {t('pages.contact.directEmail')}
              </ButtonAnchor>
            </div>
          </form>

          <p className="mt-4 text-xs leading-relaxed text-ase-muted">{t('pages.contact.footerText')}</p>
        </Card>

        <Card className="p-6" interactive>
          <div className="text-sm font-semibold text-ase-text">{t('pages.contact.details')}</div>
          <div className="mt-4 space-y-3 text-sm text-ase-text2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('pages.contact.location')}</div>
              <div className="mt-1">{t('footer.location')}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('pages.contact.focus')}</div>
              <div className="mt-1">{t('pages.contact.focusBody')}</div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{t('pages.contact.response')}</div>
              <div className="mt-1">{t('pages.contact.responseBody')}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

