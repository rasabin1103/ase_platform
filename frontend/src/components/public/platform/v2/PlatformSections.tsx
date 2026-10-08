import { ArrowRight, Check, Lock, User, X } from 'lucide-react'
import { useI18n } from '../../../../i18n'
import { useState } from 'react'
import { cn } from '../../../ui/cn'
import { Reveal, SectionHeading } from '../../home/Reveal'
import { ExampleNote, FeatureSection, VisualFrame } from '../../included/IncludedShared'
import { usePlatformCopy } from './usePlatformCopy'

/* ─────────────────────────── Flujo ─────────────────────────── */

export function PlatformFlow() {
  const f = usePlatformCopy().flow
  return (
    <section id="flow" className="scroll-mt-32 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHeading eyebrow={f.eyebrow} title={f.title} subtitle={f.subtitle} />
        <Reveal delayMs={100} className="relative mt-16">
          {/* Raíl con pulso (escritorio) */}
          <div aria-hidden className="absolute left-[7%] right-[7%] top-6 hidden h-px bg-white/10 lg:block">
            <span className="absolute -top-1 h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.9)] motion-safe:animate-flow-dot motion-reduce:hidden" />
          </div>
          <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7 lg:gap-3">
            {f.steps.map((s, i) => (
              <li key={s.title} className="relative flex gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
                <span
                  className={cn(
                    'relative z-[1] grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-lg font-semibold ring-1',
                    i === f.steps.length - 1
                      ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-400/40'
                      : 'bg-ase-surface text-sky-200 ring-white/15',
                  )}
                >
                  {i + 1}
                </span>
                <div className="lg:mt-5">
                  <p className="font-semibold text-ase-text">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ase-text2 lg:text-[13px]">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────── Multiorganización ─────────────────────────── */

export function PlatformTenancy() {
  const c = usePlatformCopy().tenancy

  const org = (name: string, role: string, products: number, sub: string, active: boolean) => (
    <div
      className={cn(
        'rounded-2xl border p-4',
        active
          ? 'border-ase-brand/50 bg-ase-brand/[0.08] shadow-[0_0_40px_-12px_rgba(76,125,255,0.7)]'
          : 'border-white/10 bg-white/[0.02] opacity-70',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-ase-text">{name}</p>
        {active ? (
          <span className="shrink-0 rounded-full bg-ase-brand/20 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
            {c.active}
          </span>
        ) : (
          <Lock className="h-3.5 w-3.5 shrink-0 text-ase-muted" aria-hidden />
        )}
      </div>
      <dl className="mt-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <dt className="text-ase-muted">{c.roleLabel}</dt>
          <dd className="font-semibold text-ase-text2">{role}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ase-muted">{c.products}</dt>
          <dd className="font-semibold text-ase-text2">{products}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ase-muted">{c.subscription}</dt>
          <dd className={cn('font-semibold', active ? 'text-emerald-300' : 'text-amber-300')}>{sub}</dd>
        </div>
      </dl>
    </div>
  )

  const visual = (
    <>
      <VisualFrame title={c.eyebrow}>
        <div className="flex flex-col items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full ase-gradient-brand text-white shadow-brand">
            <User className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-2 text-xs font-semibold text-ase-text2">{c.you}</p>
          <svg viewBox="0 0 200 40" className="h-10 w-full max-w-[320px]" aria-hidden>
            <path d="M100 0 C100 20, 50 20, 50 40" fill="none" stroke="rgba(76,125,255,0.8)" strokeWidth="1.5" />
            <path
              d="M100 0 C100 20, 150 20, 150 40"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          </svg>
        </div>
        <div className="relative grid grid-cols-2 gap-4">
          {org(c.orgA, c.roleA, 8, c.subActive, true)}
          {org(c.orgB, c.roleB, 3, c.subTrial, false)}
          <span
            aria-hidden
            className="absolute bottom-0 left-1/2 top-0 -translate-x-1/2 border-l border-dashed border-rose-400/40"
          />
        </div>
        <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-wide text-rose-300/80">
          {c.boundary}
        </p>
      </VisualFrame>
      <ExampleNote>{c.example}</ExampleNote>
    </>
  )

  return (
    <FeatureSection id="tenancy" eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} visual={visual} tinted>
      <ul className="space-y-3">
        {c.bullets.map((b) => (
          <li key={b} className="flex gap-3 text-sm text-ase-text2">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
              <Check className="h-3 w-3" aria-hidden />
            </span>
            {b}
          </li>
        ))}
      </ul>
    </FeatureSection>
  )
}

/* ─────────────────────────── Roles y permisos ─────────────────────────── */

// Capacidades permitidas por rol (índices de `rbac.capabilities`).
const ROLE_CAPS: Record<string, number[]> = {
  super_admin: [0, 1, 2, 3, 4, 5, 6],
  org_owner: [0, 1, 2, 3, 4, 5],
  org_admin: [0, 1, 2, 3, 4],
  member: [0],
  viewer: [1],
}

export function PlatformRbac() {
  const c = usePlatformCopy().rbac
  const [roleId, setRoleId] = useState('org_admin')
  const role = c.roles.find((r) => r.id === roleId) ?? c.roles[0]
  const allowed = new Set(ROLE_CAPS[role.id])

  return (
    <section id="rbac" className="scroll-mt-32 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <SectionHeading eyebrow={c.eyebrow} title={c.title} subtitle={c.subtitle} />
        <Reveal
          delayMs={100}
          className="mx-auto mt-14 grid max-w-[1100px] grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        >
          {/* Selector de rol: escalera jerárquica */}
          <div role="tablist" aria-label={c.eyebrow} className="space-y-2.5">
            {c.roles.map((r, i) => {
              const sel = r.id === roleId
              return (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  aria-selected={sel}
                  onClick={() => setRoleId(r.id)}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-brand',
                    sel
                      ? 'border-ase-brand/50 bg-ase-brand/[0.1] shadow-[0_0_40px_-15px_rgba(76,125,255,0.8)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]',
                  )}
                  style={{ marginLeft: `${i * 4}%`, width: `${100 - i * 4}%` }}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-xl font-mono text-xs font-bold',
                      sel ? 'ase-gradient-brand text-white' : 'bg-white/[0.06] text-ase-muted',
                    )}
                  >
                    {ROLE_CAPS[r.id].length}
                  </span>
                  <div className="min-w-0">
                    <p className={cn('text-sm font-semibold', sel ? 'text-ase-text' : 'text-ase-text2')}>{r.name}</p>
                    <p className="truncate text-xs text-ase-muted">{r.text}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Matriz */}
          <VisualFrame
            title={c.matrixTitle}
            badge={<span className="text-[11px] font-semibold text-sky-300">{role.name}</span>}
          >
            <ul className="space-y-2" aria-live="polite">
              {c.capabilities.map((cap, i) => {
                const ok = allowed.has(i)
                return (
                  <li
                    key={cap}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition duration-300',
                      ok ? 'border-emerald-400/25 bg-emerald-400/[0.06]' : 'border-white/[0.06] bg-transparent',
                    )}
                  >
                    <span className={cn('text-sm', ok ? 'text-ase-text' : 'text-ase-muted')}>{cap}</span>
                    {ok ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        {c.allowed}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-ase-muted">
                        <X className="h-3.5 w-3.5" aria-hidden />
                        {c.denied}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 text-[11px] text-ase-muted">{c.note}</p>
          </VisualFrame>
        </Reveal>
      </div>
    </section>
  )
}

/* ─────────────────────────── Planes ─────────────────────────── */

export function PlatformBilling() {
  const c = usePlatformCopy().billing
  // Escalera con los planes reales de la base de datos (todos, en su orden).
  const { planNames } = useI18n()
  const ladder = planNames?.all.length ? planNames.all : c.plans
  const lastIdx = ladder.length - 1

  const visual = (
    <VisualFrame title={c.ladderTitle}>
      {/* Escalera de planes */}
      <div className="flex h-48 items-end gap-3">
        {ladder.map((p, i) => (
          <div key={p} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                'flex w-full items-start justify-center rounded-t-xl border border-white/10 px-1 pt-3 transition',
                i === lastIdx ? 'ase-gradient-brand border-transparent' : 'bg-white/[0.04]',
              )}
              style={{ height: `${60 + Math.round((i * 108) / Math.max(lastIdx, 1))}px` }}
            >
              <span className={cn('truncate text-xs font-bold', i === lastIdx ? 'text-white' : 'text-ase-text2')}>{p}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 h-px bg-white/10" />
      <p className="mt-4 text-center text-xs text-ase-muted">{c.ladderNote}</p>
    </VisualFrame>
  )

  return (
    <FeatureSection
      id="billing"
      eyebrow={c.eyebrow}
      title={c.title}
      subtitle={c.subtitle}
      visual={visual}
      reverse
      tinted
    >
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {c.pipeline.map((s, i) => (
          <li key={s.title} className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <span className="font-mono text-[11px] font-semibold text-sky-300">0{i + 1}</span>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ase-text">
              {s.title}
              {i < c.pipeline.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-ase-muted" aria-hidden />}
            </p>
            <p className="mt-1 text-sm text-ase-text2">{s.text}</p>
          </li>
        ))}
      </ol>
    </FeatureSection>
  )
}
