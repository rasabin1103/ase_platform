import { ContactForm } from '../../components/public/ContactForm'
import { useI18n } from '../../i18n'

export function ContactPage() {
  const { t } = useI18n()

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[min(420px,45vh)] w-[min(720px,90vw)] -translate-x-1/2 rounded-full bg-gradient-to-b from-cyan-400/10 via-violet-500/5 to-transparent blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
            {t('pages.contact.badge')}
          </p>
          <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-ase-text sm:text-4xl lg:text-[2.75rem]">
            {t('pages.contact.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ase-text2 sm:text-lg">
            {t('pages.contact.body')}
          </p>
        </header>

        <div className="mt-12">
          <ContactForm />
        </div>

        <p className="mt-10 text-center text-sm text-ase-muted">
          <span className="text-ase-text2">{t('pages.contact.corporateEmail')}</span>{' '}
          <a
            href="mailto:contact@arcesabinengineering.com"
            className="font-medium text-cyan-300 hover:underline"
          >
            contact@arcesabinengineering.com
          </a>
          <span className="mx-2 text-white/20">·</span>
          <span>{t('pages.contact.responseBody')}</span>
        </p>
      </div>
    </section>
  )
}
