import { ArrowRight, Award, BookOpen, Briefcase, Check, Gamepad2, Library, MessagesSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHero } from '../../components/public/home/PageHero'
import { Reveal, SectionHeading } from '../../components/public/home/Reveal'
import { PricingSection } from '../../components/public/PricingSection'
import { PurchaseVsSubscriptionFaq } from '../../components/public/PurchaseVsSubscriptionFaq'
import { SubscriptionPolicyFaq } from '../../components/public/SubscriptionPolicyFaq'
import { ButtonLink } from '../../components/ui/Button'
import { useI18n } from '../../i18n'
import { pagesV2En, pagesV2Es } from '../../i18n/pagesV2.locale'
import { usePageTitle } from '../../hooks/usePageTitle'

const INCLUDED_ICONS = [Library, Gamepad2, BookOpen, Briefcase, MessagesSquare, Award]

export function PricingPage() {
  const { t, language } = useI18n()
  const c = (language === 'en' ? pagesV2En : pagesV2Es).pricing
  usePageTitle(t('pricing.title') as string, t('pricing.subtitle') as string)

  return (
    <div className="overflow-x-clip bg-ase-bg">
      <PageHero
        eyebrow={c.eyebrow}
        titleBefore={c.titleBefore}
        titleHighlight={c.titleHighlight}
        titleAfter={c.titleAfter}
        subtitle={c.subtitle}
      >
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-ase-muted">
          {c.trust.map((m) => (
            <li key={m} className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400" aria-hidden />
              {m}
            </li>
          ))}
        </ul>
      </PageHero>

      <PricingSection hideIntro />

      {/* Todos los planes incluyen */}
      <section className="py-16">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <Reveal>
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-9">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-display text-2xl font-semibold text-ase-text">{c.includedTitle}</p>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 hover:text-sky-200"
                >
                  {c.includedCta}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {c.included.map((label, i) => {
                  const Icon = INCLUDED_ICONS[i]
                  return (
                    <li
                      key={label}
                      className="flex flex-col items-start gap-3 rounded-2xl border border-white/[0.07] bg-ase-surface/60 p-4"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-ase-brand/15 text-sky-300 ring-1 ring-ase-brand/30">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-ase-text">{label}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/5 bg-ase-bg2/40 py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <SectionHeading eyebrow={c.faqEyebrow} title={c.faqTitle} />
          <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
            <PurchaseVsSubscriptionFaq />
            <SubscriptionPolicyFaq />
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="mx-auto max-w-[1400px] px-5 pb-28 pt-20 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] p-px">
            <div aria-hidden className="absolute inset-0 ase-gradient-brand opacity-80" />
            <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-ase-bg px-6 py-16 text-center sm:px-12">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-ase-brand/25 blur-[100px]"
              />
              <h2 className="relative mx-auto max-w-3xl font-display text-3xl font-semibold leading-tight text-ase-text sm:text-4xl">
                {c.ctaTitle}
              </h2>
              <p className="relative mx-auto mt-5 max-w-xl text-base text-ase-text2">{c.ctaSubtitle}</p>
              <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink to="/contact" size="lg">
                  {c.ctaPrimary}
                </ButtonLink>
                <ButtonLink to="/academy" size="lg" variant="secondary">
                  {c.ctaSecondary}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
