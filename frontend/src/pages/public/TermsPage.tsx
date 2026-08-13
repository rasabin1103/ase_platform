import { useMemo } from 'react'
import { Eyebrow } from '../../components/ui/Eyebrow'
import { useI18n } from '../../i18n'
import { usePageTitle } from '../../hooks/usePageTitle'

type LegalSection = { heading: string; body: string }

export function TermsPage() {
  const { t } = useI18n()
  usePageTitle(t('legal.terms.title') as string, t('legal.terms.intro') as string)
  const sections = useMemo(() => t<LegalSection[]>('legal.terms.sections'), [t])

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-14 sm:py-20">
      <Eyebrow>{t('legal.terms.badge')}</Eyebrow>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
        {t('legal.terms.title')}
      </h1>
      <p className="mt-2 text-sm text-ase-muted">{t('legal.terms.lastUpdated')}</p>
      <p className="mt-6 max-w-3xl text-base leading-relaxed text-ase-text2">{t('legal.terms.intro')}</p>

      <div className="mt-12 space-y-10 border-t border-white/[0.08] pt-10">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-lg font-bold text-ase-text">
              {i + 1}. {s.heading}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ase-text2">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
