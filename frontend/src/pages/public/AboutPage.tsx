import { ArrowRight, Check, Compass, Gauge, Layers, ShieldCheck, Sparkles, Target, Workflow } from 'lucide-react'
import { useMemo } from 'react'
import { ButtonLink } from '../../components/ui/Button'
import { cn } from '../../components/ui/cn'
import { Reveal, SectionHeading } from '../../components/public/home/Reveal'
import { LivePlatformStats } from '../../components/public/home/LivePlatformStats'
import { tStringArray, useI18n } from '../../i18n'
import { aboutV2En, aboutV2Es } from '../../i18n/aboutV2.locale'
import { usePageTitle } from '../../hooks/usePageTitle'

// Antes → después de cada métrica de impacto (escala 0–100 para las barras).
const IMPACT_BARS: Record<'m1' | 'm2' | 'm3', [number, number]> = {
  m1: [100, 40],
  m2: [25, 90],
  m3: [100, 30],
}
const BUILD_ICONS = { architecture: Layers, automation: Workflow, product: Target, ux: Sparkles } as const

export function AboutPage() {
  const { t, language } = useI18n()
  const v = language === 'en' ? aboutV2En : aboutV2Es
  usePageTitle(t('aboutPage.hero.title') as string, t('aboutPage.hero.subtitle') as string)

  const differentiators = useMemo(() => tStringArray(t, 'aboutPage.differentiators.items'), [t])
  const philosophy = useMemo(() => tStringArray(t, 'aboutPage.principles.cards.philosophy.bullets'), [t])
  const history = useMemo(() => t<Array<{ year: string; body: string }>>('aboutPage.history.items'), [t])
  const signals = useMemo(() => t<Array<{ title: string; desc: string }>>('aboutPage.why.timeline.items'), [t])

  return (
    <div className="overflow-x-clip bg-ase-bg">
      {/* ───────────── HERO ───────────── */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 -top-32 h-[32rem] w-[32rem] rounded-full bg-ase-brand/25 blur-[120px] motion-safe:animate-home-drift" />
          <div
            className="absolute -right-24 top-24 h-[28rem] w-[28rem] rounded-full bg-amber-400/10 blur-[120px] motion-safe:animate-home-drift"
            style={{ animationDelay: '-9s' }}
          />
        </div>
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:pb-24">
          <div className="min-w-0">
            <div className="inline-flex animate-fade-in-up items-center gap-2.5">
              <span className="h-px w-8 bg-ase-brand/60" />
              <span className="text-label font-semibold uppercase text-ase-brand">{t('aboutPage.hero.badge')}</span>
            </div>
            <h1
              className="mt-6 animate-fade-in-up font-display text-[2.5rem] font-semibold leading-[1.05] tracking-tight text-ase-text sm:text-display-lg lg:text-display-xl"
              style={{ animationDelay: '80ms' }}
            >
              {v.hero.titleBefore} <span className="ase-text-gradient">{v.hero.titleHighlight}</span>
              {v.hero.titleAfter}
            </h1>
            <p
              className="mt-7 max-w-[60ch] animate-fade-in-up text-base leading-relaxed text-ase-text2 sm:text-lg"
              style={{ animationDelay: '160ms' }}
            >
              {t('aboutPage.hero.subtitle')}
            </p>
            <div
              className="mt-9 flex animate-fade-in-up flex-col gap-3 sm:flex-row"
              style={{ animationDelay: '240ms' }}
            >
              <ButtonLink
                to="/services"
                size="lg"
                className="w-full sm:w-auto"
                rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
              >
                {t('aboutPage.hero.primaryCta')}
              </ButtonLink>
              <ButtonLink to="/contact" size="lg" variant="secondary" className="w-full sm:w-auto">
                {t('aboutPage.hero.secondaryCta')}
              </ButtonLink>
            </div>
          </div>

          {/* Tarjeta del fundador */}
          <div className="relative mx-auto w-full max-w-[500px] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div aria-hidden className="absolute inset-6 -z-10 rounded-[2.5rem] bg-ase-brand/20 blur-3xl" />
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-ase-surface/85 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
              {/* Retrato: foto recortada sobre halo de marca */}
              <div className="relative h-72 overflow-hidden sm:h-80">
                <div aria-hidden className="absolute inset-0">
                  <div className="absolute left-1/2 top-[55%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ase-brand/45 blur-[70px]" />
                  <div className="absolute right-6 top-6 h-32 w-32 rounded-full bg-violet-500/25 blur-[50px]" />
                  <div
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
                      backgroundSize: '32px 32px',
                    }}
                  />
                </div>
                <img
                  src="/images/founder-roberto.webp"
                  alt={v.founder.photoAlt}
                  width={640}
                  height={640}
                  className="absolute inset-0 h-full w-full object-cover object-[50%_8%]"
                />
              </div>
              <div className="flex items-end justify-between gap-3 border-y border-white/[0.07] px-6 py-5 sm:px-7">
                <div className="min-w-0">
                  <p className="font-display text-xl font-semibold text-ase-text">{v.founder.name}</p>
                  <p className="mt-0.5 text-sm text-ase-text2">{v.founder.role}</p>
                </div>
                <p className="shrink-0 text-right">
                  <span className="block font-display text-3xl font-semibold leading-none text-ase-text">10+</span>
                  <span className="mt-1 block max-w-[9rem] text-[11px] leading-tight text-ase-muted">
                    {v.founder.years}
                  </span>
                </p>
              </div>
              <div className="p-6 sm:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                  {v.founder.companiesTitle}
                </p>
                <ul className="mt-4 grid grid-cols-2 gap-3">
                  {v.founder.companies.map((c) => (
                    <li key={c.name} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-sm font-semibold text-ase-text">{c.name}</p>
                      <p className="mt-0.5 text-xs text-ase-muted">{c.sector}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── ORIGEN ───────────── */}
      <section className="border-t border-white/5 bg-ase-bg2/40 py-20 lg:py-28">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-start gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow={t('aboutPage.why.badge')}
              title={t('aboutPage.why.title')}
              subtitle={t('aboutPage.why.body')}
              align="left"
            />
          </div>
          <Reveal delayMs={100}>
            <div className="rounded-3xl border border-white/10 bg-ase-surface/80 p-7 sm:p-9">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                {t('aboutPage.why.timeline.title')}
              </p>
              <ol className="relative mt-7 space-y-7 border-l border-white/10 pl-7">
                {signals.map((s, i) => (
                  <li key={s.title} className="relative">
                    <span
                      aria-hidden
                      className={cn(
                        'absolute -left-[33px] top-1 h-3 w-3 rounded-full ring-4 ring-ase-surface',
                        ['bg-rose-400', 'bg-amber-400', 'bg-sky-400', 'bg-violet-400'][i % 4],
                      )}
                    />
                    <p className="font-semibold text-ase-text">{s.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ase-text2">{s.desc}</p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────── IMPACTO ───────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <SectionHeading eyebrow={v.impact.eyebrow} title={t('aboutPage.impact.title')} />
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
            {(['m1', 'm2', 'm3'] as const).map((id, i) => {
              const [before, after] = IMPACT_BARS[id]
              return (
                <Reveal key={id} delayMs={i * 100}>
                  <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                    <p className="font-display text-5xl font-semibold text-ase-text">
                      {t(`aboutPage.impact.items.${id}.value`)}
                    </p>
                    <p className="mt-3 font-semibold text-ase-text">{t(`aboutPage.impact.items.${id}.label`)}</p>
                    <p className="mt-1 text-sm text-ase-muted">{t(`aboutPage.impact.items.${id}.sub`)}</p>
                    <div className="mt-7 space-y-3" aria-hidden>
                      <BeforeAfter label={v.impact.before} value={before} tone="bg-white/25" />
                      <BeforeAfter label={v.impact.after} value={after} tone="bg-emerald-400" />
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────────── ASE HOY (en vivo) ───────────── */}
      <section className="border-y border-white/5 bg-ase-bg2/40 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <SectionHeading eyebrow={v.today.eyebrow} title={v.today.title} subtitle={v.today.subtitle} />
          <Reveal delayMs={100} className="mt-14">
            <LivePlatformStats labels={v.today} />
          </Reveal>
        </div>
      </section>

      {/* ───────────── MISIÓN · VISIÓN · FILOSOFÍA ───────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <SectionHeading eyebrow={t('aboutPage.principles.badge')} title={t('aboutPage.build.subtitle')} />
          <div className="mt-14 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {(['mission', 'vision'] as const).map((id, i) => {
              const Icon = id === 'mission' ? Compass : Gauge
              return (
                <Reveal key={id} delayMs={i * 100}>
                  <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-ase-brand/15 text-sky-300 ring-1 ring-ase-brand/30">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="mt-5 text-lg font-semibold text-ase-text">
                      {t(`aboutPage.principles.cards.${id}.title`)}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-ase-text2">
                      {t(`aboutPage.principles.cards.${id}.body`)}
                    </p>
                  </div>
                </Reveal>
              )
            })}
            <Reveal delayMs={200}>
              <div className="h-full rounded-3xl border border-ase-brand/40 bg-ase-brand/[0.08] p-7 shadow-[0_0_60px_-25px_rgba(76,125,255,0.7)]">
                <span className="grid h-11 w-11 place-items-center rounded-xl ase-gradient-brand text-white">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-5 text-lg font-semibold text-ase-text">
                  {t('aboutPage.principles.cards.philosophy.title')}
                </p>
                <ul className="mt-3 space-y-2">
                  {philosophy.map((b) => (
                    <li key={b} className="flex gap-2.5 text-sm text-ase-text2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* Cómo construimos */}
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {(['architecture', 'automation', 'product', 'ux'] as const).map((id, i) => {
              const Icon = BUILD_ICONS[id]
              return (
                <Reveal key={id} delayMs={i * 80}>
                  <div className="h-full rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                    <Icon className="h-5 w-5 text-sky-300" aria-hidden />
                    <p className="mt-4 font-semibold text-ase-text">{t(`aboutPage.build.items.${id}.title`)}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ase-text2">
                      {t(`aboutPage.build.items.${id}.body`)}
                    </p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────────── DIFERENCIALES ───────────── */}
      <section className="bg-ase-bg2/40 py-20 lg:py-28">
        <div className="mx-auto max-w-[1100px] px-5 sm:px-8">
          <SectionHeading eyebrow={t('aboutPage.differentiators.badge')} title={t('aboutPage.differentiators.title')} />
          <Reveal delayMs={100} className="mt-12 flex flex-wrap justify-center gap-3">
            {differentiators.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-ase-text2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-ase-brand" aria-hidden />
                {d}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ───────────── TIMELINE ───────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
          <SectionHeading eyebrow={t('aboutPage.history.badge')} title={t('aboutPage.history.title')} />
          <Reveal delayMs={100} className="relative mt-14">
            <div aria-hidden className="absolute left-0 right-0 top-[22px] hidden h-px bg-white/10 md:block" />
            <ol className="grid grid-cols-1 gap-6 md:grid-cols-4">
              {history.map((h, i) => {
                const future = i === history.length - 1
                return (
                  <li key={h.year} className="relative">
                    <span
                      className={cn(
                        'relative z-[1] inline-flex h-11 items-center rounded-full px-4 font-display text-lg font-semibold',
                        future
                          ? 'border border-dashed border-ase-brand/50 text-sky-200'
                          : 'ase-gradient-brand text-white shadow-brand',
                      )}
                    >
                      {h.year}
                    </span>
                    <p className="mt-4 text-sm leading-relaxed text-ase-text2">{h.body}</p>
                  </li>
                )
              })}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* ───────────── CIERRE ───────────── */}
      <section className="mx-auto max-w-[1400px] px-5 pb-28 pt-4 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] p-px">
            <div aria-hidden className="absolute inset-0 ase-gradient-brand opacity-80" />
            <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-ase-bg px-6 py-16 text-center sm:px-12 sm:py-20">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-ase-brand/25 blur-[100px]"
              />
              <h2 className="relative mx-auto max-w-3xl font-display text-3xl font-semibold leading-tight text-ase-text sm:text-5xl">
                {t('aboutPage.closing.title')}
              </h2>
              <p className="relative mx-auto mt-6 max-w-xl whitespace-pre-line text-base leading-relaxed text-ase-text2 sm:text-lg">
                {t('aboutPage.closing.body')}
              </p>
              <div className="relative mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <ButtonLink to="/contact" size="lg">
                  {t('aboutPage.closing.ctas.talk')}
                </ButtonLink>
                <ButtonLink to="/platform" size="lg" variant="secondary">
                  {t('aboutPage.closing.ctas.platform')}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}

function BeforeAfter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr] items-center gap-3">
      <span className="text-xs text-ase-muted">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
