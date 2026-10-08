import { BookOpen, Briefcase, Check, Crown, Gamepad2, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { ButtonLink } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { useHomeCopy } from './useHomeCopy'

export function HomeHero() {
  const c = useHomeCopy().hero
  return (
    <section className="relative isolate overflow-hidden">
      {/* Fondo: halos de marca + retícula sutil con desvanecido. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-ase-brand/25 blur-[120px] motion-safe:animate-home-drift" />
        <div
          className="absolute -right-32 top-24 h-[30rem] w-[30rem] rounded-full bg-ase-brand-strong/20 blur-[120px] motion-safe:animate-home-drift"
          style={{ animationDelay: '-9s' }}
        />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-400/10 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 30%, transparent 75%)',
          }}
        />
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-28 lg:pt-24">
        <div className="min-w-0">
          <div className="inline-flex animate-fade-in-up items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-4 text-xs font-medium text-ase-text2">
            <span className="rounded-full ase-gradient-brand px-2.5 py-0.5 text-[11px] font-semibold text-white">
              ASE
            </span>
            {c.eyebrow}
          </div>
          <h1
            className="mt-7 animate-fade-in-up font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-ase-text sm:text-display-lg lg:text-display-xl"
            style={{ animationDelay: '80ms' }}
          >
            {c.titleBefore} <span className="ase-text-gradient">{c.titleHighlight}</span>
            {c.titleAfter}
          </h1>
          <p
            className="mt-7 max-w-[52ch] animate-fade-in-up text-base leading-relaxed text-ase-text2 sm:text-lg"
            style={{ animationDelay: '160ms' }}
          >
            {c.subtitle}
          </p>
          <div className="mt-9 flex animate-fade-in-up flex-col gap-3 sm:flex-row" style={{ animationDelay: '240ms' }}>
            <ButtonLink to="/pricing" size="lg" className="w-full sm:w-auto">
              {c.primaryCta}
            </ButtonLink>
            <ButtonLink
              to="/academy"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              leftIcon={<Gamepad2 className="h-4 w-4" aria-hidden />}
            >
              {c.secondaryCta}
            </ButtonLink>
            <ButtonLink to="/login" size="lg" variant="ghost" className="w-full sm:w-auto">
              {c.loginCta}
            </ButtonLink>
          </div>
          <ul
            className="mt-8 flex animate-fade-in-up flex-wrap gap-x-6 gap-y-2 text-sm text-ase-muted"
            style={{ animationDelay: '320ms' }}
          >
            {c.micro.map((m) => (
              <li key={m} className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" aria-hidden />
                {m}
              </li>
            ))}
          </ul>
        </div>

        <ProductMosaic />
      </div>
    </section>
  )
}

/** Composición ilustrativa de la plataforma (datos de ejemplo, no reales). */
function ProductMosaic() {
  const v = useHomeCopy().hero.visual
  return (
    <div className="relative mx-auto w-full max-w-[560px] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
      <div aria-hidden className="absolute inset-6 -z-10 rounded-[2.5rem] bg-ase-brand/20 blur-3xl" />
      <div className="grid grid-cols-6 gap-4">
        {/* Academy (principal) */}
        <Panel className="col-span-6 sm:col-span-4" delay="0s">
          <Tag icon={<Gamepad2 className="h-3.5 w-3.5" />} tone="brand">
            {v.academyTag}
          </Tag>
          <p className="mt-3 text-sm font-semibold text-ase-text">{v.academyTitle}</p>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3 font-mono text-[11px] leading-5 text-ase-text2">
            <div>
              <span className="text-sky-300">if</span> (importe &gt; <span className="text-amber-300">3000</span>) {'{'}
            </div>
            <div className="border-l-2 border-emerald-400/70 pl-3">aprobación = 'doble'</div>
            <div>
              {'}'} <span className="text-sky-300">else</span> {'{'}
            </div>
            <div className="border-l-2 border-rose-400/70 bg-rose-500/10 pl-3">aprobación = 'simple'</div>
            <div>{'}'}</div>
          </div>
          <Bar label={v.academyStatements} value={100} tone="bg-emerald-400" />
          <Bar label={v.academyBranches} value={50} tone="bg-amber-400" />
        </Panel>

        {/* Empleo: anillo de encaje */}
        <Panel className="col-span-3 sm:col-span-2" delay="-2s">
          <Tag icon={<Briefcase className="h-3.5 w-3.5" />} tone="cyan">
            {v.jobsTag}
          </Tag>
          <div className="mt-4 flex flex-col items-center">
            <FitRing value={82} />
            <p className="mt-3 text-center text-xs text-ase-muted">{v.jobsTitle}</p>
            <p className="text-sm font-semibold text-emerald-300">{v.jobsLevel}</p>
          </div>
        </Panel>

        {/* Catálogo: libro */}
        <Panel className="col-span-3 sm:col-span-4" delay="-4s">
          <div className="flex items-start gap-3">
            <div className="hidden h-20 w-14 shrink-0 items-end rounded-md ase-gradient-brand sm:flex p-1.5 shadow-brand">
              <BookOpen className="h-4 w-4 text-white/80" aria-hidden />
            </div>
            <div className="min-w-0">
              <Tag icon={<BookOpen className="h-3.5 w-3.5" />} tone="gold">
                {v.catalogType}
              </Tag>
              <p className="mt-2 truncate text-sm font-semibold text-ase-text">{v.catalogTitle}</p>
              <div className="mt-1 flex items-center gap-0.5 text-amber-300" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <p className="mt-1 hidden text-[11px] text-ase-muted sm:block">{v.catalogFormats}</p>
            </div>
          </div>
        </Panel>

        {/* Fidelidad */}
        <Panel className="col-span-6 sm:col-span-2" delay="-6s">
          <Tag icon={<Crown className="h-3.5 w-3.5" />} tone="gold">
            {v.loyaltyTag}
          </Tag>
          <p className="mt-3 text-lg font-semibold text-amber-300">{v.loyaltyLevel}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 rounded-full bg-amber-400" />
          </div>
        </Panel>
      </div>
      <p className="mt-4 text-center text-[11px] uppercase tracking-[0.18em] text-ase-muted/70">{v.example}</p>
    </div>
  )
}

function Panel({ children, className, delay }: { children: ReactNode; className?: string; delay: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-ase-surface/80 p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] motion-safe:animate-home-float',
        className,
      )}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  )
}

const TAG_TONES = {
  brand: 'border-ase-brand/30 bg-ase-brand/15 text-sky-200',
  cyan: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200',
  gold: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
} as const

function Tag({ children, icon, tone }: { children: ReactNode; icon: ReactNode; tone: keyof typeof TAG_TONES }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        TAG_TONES[tone],
      )}
    >
      {icon}
      {children}
    </span>
  )
}

function Bar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[11px] text-ase-muted">
        <span>{label}</span>
        <span className="font-semibold text-ase-text2">{value} %</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function FitRing({ value }: { value: number }) {
  const r = 30
  const len = 2 * Math.PI * r
  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke="url(#homeFitGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - value / 100)}
        />
        <defs>
          <linearGradient id="homeFitGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg font-bold text-ase-text">{value}%</span>
    </div>
  )
}
