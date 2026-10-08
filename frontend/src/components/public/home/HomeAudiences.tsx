import { Building, Check, User, Users } from 'lucide-react'
import { ButtonLink } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { Reveal, SectionHeading } from './Reveal'
import { useHomeCopy } from './useHomeCopy'

export function HomeAudiences() {
  const a = useHomeCopy().audiences
  const cols = [
    { key: 'pro', data: a.items.pro, icon: User, to: '/pricing', featured: false },
    { key: 'teams', data: a.items.teams, icon: Users, to: '/pricing', featured: true },
    { key: 'enterprise', data: a.items.enterprise, icon: Building, to: '/contact', featured: false },
  ] as const
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:py-32">
      <SectionHeading eyebrow={a.eyebrow} title={a.title} />
      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {cols.map(({ key, data, icon: Icon, to, featured }, i) => (
          <Reveal key={key} delayMs={i * 100}>
            <div
              className={cn(
                'relative flex h-full flex-col rounded-3xl border p-8',
                featured
                  ? 'border-ase-brand/40 bg-ase-brand/[0.08] shadow-[0_0_60px_-20px_rgba(76,125,255,0.6)]'
                  : 'border-white/10 bg-white/[0.03]',
              )}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06] text-sky-300 ring-1 ring-white/10">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-6 text-xl font-semibold text-ase-text">{data.title}</h3>
              <ul className="mt-5 flex-1 space-y-3">
                {data.bullets.map((b) => (
                  <li key={b} className="flex gap-3 text-sm leading-relaxed text-ase-text2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                    {b}
                  </li>
                ))}
              </ul>
              <ButtonLink to={to} variant={featured ? 'primary' : 'secondary'} className="mt-8 w-full">
                {data.cta}
              </ButtonLink>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

export function HomeSteps() {
  const s = useHomeCopy().steps
  return (
    <section className="mx-auto max-w-[1400px] px-5 py-24 sm:px-8 lg:py-28">
      <SectionHeading eyebrow={s.eyebrow} title={s.title} />
      <ol className="relative mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
        <div aria-hidden className="absolute left-0 right-0 top-7 hidden h-px bg-white/10 md:block" />
        {s.items.map((it, i) => (
          <Reveal as="li" key={it.title} delayMs={i * 120} className="relative text-center">
            <span className="relative mx-auto grid h-14 w-14 place-items-center rounded-2xl ase-gradient-brand font-display text-xl font-semibold text-white shadow-brand">
              {i + 1}
            </span>
            <h3 className="mt-6 text-lg font-semibold text-ase-text">{it.title}</h3>
            <p className="mx-auto mt-2 max-w-[32ch] text-sm leading-relaxed text-ase-text2">{it.text}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}

export function HomeFinalCta() {
  const f = useHomeCopy().finalCta
  return (
    <section className="mx-auto max-w-[1400px] px-5 pb-28 pt-8 sm:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] p-px">
          <div aria-hidden className="absolute inset-0 ase-gradient-brand opacity-80" />
          <div className="relative overflow-hidden rounded-[calc(2rem-1px)] bg-ase-bg px-6 py-16 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-ase-brand/25 blur-[100px]"
            />
            <h2 className="relative mx-auto max-w-3xl font-display text-3xl font-semibold leading-tight text-ase-text sm:text-5xl">
              {f.title}
            </h2>
            <p className="relative mx-auto mt-5 max-w-xl text-base text-ase-text2 sm:text-lg">{f.subtitle}</p>
            <div className="relative mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink to="/pricing" size="lg">
                {f.primary}
              </ButtonLink>
              <ButtonLink to="/academy" size="lg" variant="secondary">
                {f.secondary}
              </ButtonLink>
              <ButtonLink to="/contact" size="lg" variant="ghost">
                {f.tertiary}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
