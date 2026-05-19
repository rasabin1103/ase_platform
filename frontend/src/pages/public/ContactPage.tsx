import { useMemo, useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useI18n } from '../../i18n'

type ContactValues = {
  name: string
  email: string
  company: string
  message: string
}

export function ContactPage() {
  const [values, setValues] = useState<ContactValues>({ name: '', email: '', company: '', message: '' })
  const { t } = useI18n()

  const mailto = useMemo(() => {
    const subject = encodeURIComponent(String(t('pages.contact.subject')))
    const body = encodeURIComponent(
      [
        `${t('pages.contact.fields.name')}: ${values.name || '—'}`,
        `${t('pages.contact.fields.email')}: ${values.email || '—'}`,
        `${t('pages.contact.fields.company')}: ${values.company || '—'}`,
        '',
        values.message || '',
      ].join('\n'),
    )
    return `mailto:contact@arcesabin.engineering?subject=${subject}&body=${body}`
  }, [values, t])

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14">
      <Badge variant="info" className="w-fit">
        {t('pages.contact.badge')}
      </Badge>
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

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('pages.contact.fields.name')}</label>
              <Input
                value={values.name}
                onChange={(e) => setValues((v) => ({ ...v, name: String(e.target.value ?? '') }))}
                placeholder={String(t('pages.contact.fields.namePh'))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('pages.contact.fields.email')}</label>
              <Input
                value={values.email}
                onChange={(e) => setValues((v) => ({ ...v, email: String(e.target.value ?? '') }))}
                placeholder="name@company.com"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('pages.contact.fields.company')}</label>
              <Input
                value={values.company}
                onChange={(e) => setValues((v) => ({ ...v, company: String(e.target.value ?? '') }))}
                placeholder={String(t('pages.contact.fields.companyPh'))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-ase-muted">{t('pages.contact.fields.message')}</label>
              <textarea
                className="min-h-32 w-full resize-none rounded-md border border-ase-border bg-ase-surface px-3 py-2 text-sm text-ase-text outline-none transition focus-visible:border-ase-primary/60 focus-visible:ring-2 focus-visible:ring-ase-accent/30"
                value={values.message}
                onChange={(e) => setValues((v) => ({ ...v, message: String(e.target.value ?? '') }))}
                placeholder={String(t('pages.contact.fields.messagePh'))}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a href={mailto} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">{t('pages.contact.openClient')}</Button>
            </a>
            <a href="mailto:contact@arcesabin.engineering" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                contact@arcesabin.engineering
              </Button>
            </a>
          </div>
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

