import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Check, Clock, MapPin, Send, Target } from 'lucide-react'
import { Button, ButtonAnchor } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { TurnstileWidget } from '../../components/auth/TurnstileWidget'
import { PageHero } from '../../components/public/home/PageHero'
import { Reveal } from '../../components/public/home/Reveal'
import { submitContactMessage } from '../../api/plansCatalog.api'
import { useI18n } from '../../i18n'
import { pagesV2En, pagesV2Es } from '../../i18n/pagesV2.locale'
import { usePageTitle } from '../../hooks/usePageTitle'

type ContactValues = {
  name: string
  email: string
  company: string
  message: string
}

const LABEL = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ase-muted'

export function ContactPage() {
  const { t, language } = useI18n()
  // ?topic=<título> (p. ej. desde una ficha sin muestra) deja el mensaje empezado.
  const [searchParams] = useSearchParams()
  const topic = searchParams.get('topic')
  const [values, setValues] = useState<ContactValues>(() => ({
    name: '',
    email: '',
    company: '',
    message: topic
      ? language === 'en'
        ? `Hi, I have a question about «${topic}»: `
        : `Hola, tengo una duda sobre «${topic}»: `
      : '',
  }))
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const c = (language === 'en' ? pagesV2En : pagesV2Es).contact
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

  const details = [
    { Icon: MapPin, label: t('pages.contact.location'), value: t('footer.location') },
    { Icon: Target, label: t('pages.contact.focus'), value: t('pages.contact.focusBody') },
    { Icon: Clock, label: t('pages.contact.response'), value: t('pages.contact.responseBody') },
  ]

  return (
    <div className="overflow-x-clip bg-ase-bg">
      <PageHero
        eyebrow={c.eyebrow}
        titleBefore={c.titleBefore}
        titleHighlight={c.titleHighlight}
        titleAfter={c.titleAfter}
        subtitle={t('pages.contact.body')}
        align="left"
        compact
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ase-muted">
          {(['trust1', 'trust2', 'trust3'] as const).map((key) => (
            <li key={key} className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" aria-hidden />
              {t(`pages.contact.${key}`)}
            </li>
          ))}
        </ul>
      </PageHero>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-5 pb-28 pt-4 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Formulario */}
        <Reveal>
          <div className="rounded-3xl border border-white/10 bg-ase-surface/80 p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] sm:p-9">
            <p className="font-display text-2xl font-semibold text-ase-text">{t('pages.contact.sendTitle')}</p>
            <p className="mt-1.5 text-sm text-ase-text2">{t('pages.contact.sendSubtitle')}</p>

            <form
              className="mt-7"
              onSubmit={(e) => {
                e.preventDefault()
                mutation.mutate()
              }}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className={LABEL}>
                    {t('pages.contact.fields.name')}
                  </label>
                  <Input
                    id="contact-name"
                    required
                    value={values.name}
                    onChange={(e) => setValues((v) => ({ ...v, name: String(e.target.value ?? '') }))}
                    placeholder={String(t('pages.contact.fields.namePh'))}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className={LABEL}>
                    {t('pages.contact.fields.email')}
                  </label>
                  <Input
                    id="contact-email"
                    type="email"
                    required
                    value={values.email}
                    onChange={(e) => setValues((v) => ({ ...v, email: String(e.target.value ?? '') }))}
                    placeholder={t('auth.fields.emailPlaceholder')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="contact-company" className={LABEL}>
                    {t('pages.contact.fields.company')}
                  </label>
                  <Input
                    id="contact-company"
                    value={values.company}
                    onChange={(e) => setValues((v) => ({ ...v, company: String(e.target.value ?? '') }))}
                    placeholder={String(t('pages.contact.fields.companyPh'))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="contact-message" className={LABEL}>
                    {t('pages.contact.fields.message')}
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    className="min-h-40 w-full resize-y rounded-xl border border-white/10 bg-ase-bg/60 px-4 py-3 text-sm text-ase-text outline-none transition placeholder:text-ase-muted focus-visible:border-ase-brand/50 focus-visible:ring-2 focus-visible:ring-ase-brand/30"
                    value={values.message}
                    onChange={(e) => setValues((v) => ({ ...v, message: String(e.target.value ?? '') }))}
                    placeholder={String(t('pages.contact.fields.messagePh'))}
                  />
                </div>
              </div>

              <div className="mt-4">
                <TurnstileWidget onVerify={setTurnstileToken} />
              </div>

              {mutation.isSuccess ? (
                <p
                  role="status"
                  className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
                >
                  {t('pages.contact.submitSuccess')}
                </p>
              ) : null}
              {mutation.isError ? (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-ase-error/30 bg-ase-error/10 px-4 py-3 text-sm text-ase-error"
                >
                  {t('pages.contact.submitError')}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={mutation.isPending}
                  rightIcon={<Send className="h-4 w-4" aria-hidden />}
                >
                  {mutation.isPending ? t('pages.contact.submitting') : t('pages.contact.submit')}
                </Button>
                <ButtonAnchor
                  href="mailto:contact@arcesabinengineering.com"
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  {t('pages.contact.directEmail')}
                </ButtonAnchor>
              </div>
            </form>

            <p className="mt-5 text-xs leading-relaxed text-ase-muted">{t('pages.contact.footerText')}</p>
          </div>
        </Reveal>

        {/* Lateral */}
        <div className="space-y-6">
          <Reveal delayMs={100}>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-ase-surface/80">
              <div className="flex items-center gap-4 border-b border-white/[0.07] p-6">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-ase-brand/30 ring-2 ring-ase-brand/40">
                  <img
                    src="/images/founder-roberto.webp"
                    alt=""
                    width={640}
                    height={640}
                    className="h-full w-full object-cover object-[50%_10%]"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ase-text">{c.responder}</p>
                  <p className="text-sm text-ase-muted">{c.responderRole}</p>
                </div>
              </div>
              <ul className="space-y-5 p-6">
                {details.map(({ Icon, label, value }) => (
                  <li key={label} className="flex gap-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ase-brand/15 text-sky-300 ring-1 ring-ase-brand/30">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{label}</p>
                      <p className="mt-0.5 text-sm text-ase-text2">{value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delayMs={180}>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{c.nextTitle}</p>
              <ol className="mt-5 space-y-4">
                {c.next.map((step, i) => (
                  <li key={step} className="flex gap-3.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full ase-gradient-brand text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-ase-text2">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
