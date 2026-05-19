import { useMemo, useState } from 'react'
import { tStringArray, useI18n } from '../../../i18n'
import { Badge } from '../../ui/Badge'
import { cn } from '../../ui/cn'

type OrgId = 'orgA' | 'orgB'

export function TenantArchitectureVisual() {
  const { t } = useI18n()
  const [active, setActive] = useState<OrgId>('orgA')

  const bullets = useMemo(() => tStringArray(t, 'platformPage.multiTenant.bullets'), [t])

  return (
    <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_0%_10%,rgba(34,211,238,0.10),transparent_55%)]" />

      <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          <div className="lg:col-span-5">
            <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
              {t('platformPage.multiTenant.badge')}
            </Badge>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
              {t('platformPage.multiTenant.title')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg">{t('platformPage.multiTenant.subtitle')}</p>

            <ul className="mt-8 space-y-3">
              {bullets.map((b, i) => (
                <li key={`b-${i}`} className="flex gap-3 text-sm text-ase-text2 sm:text-base">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ase-accent/80 shadow-[0_0_14px_rgba(34,211,238,0.18)]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/45 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
              <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
              <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-ase-primary/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-ase-accent/8 blur-3xl" />

              <div className="relative z-[1] flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                    {t('platformPage.multiTenant.visual.activeContext')}
                  </span>
                  <button
                    type="button"
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition',
                      active === 'orgA'
                        ? 'border-ase-primary/35 bg-ase-primary/10 text-ase-primary'
                        : 'border-white/10 bg-white/[0.03] text-ase-text2 hover:bg-white/[0.05]',
                    )}
                    onClick={() => setActive('orgA')}
                  >
                    {t('platformPage.multiTenant.visual.orgs.orgA')}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition',
                      active === 'orgB'
                        ? 'border-ase-primary/35 bg-ase-primary/10 text-ase-primary'
                        : 'border-white/10 bg-white/[0.03] text-ase-text2 hover:bg-white/[0.05]',
                    )}
                    onClick={() => setActive('orgB')}
                  >
                    {t('platformPage.multiTenant.visual.orgs.orgB')}
                  </button>
                </div>

                {/* User -> orgs */}
                <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
                  <div className="lg:col-span-4">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{t('platformPage.diagram.nodes.user.title')}</div>
                        <span className="h-2 w-2 rounded-full bg-ase-accent/80 shadow-[0_0_14px_rgba(34,211,238,0.18)]" />
                      </div>
                      <div className="mt-3 space-y-2">
                        <Pill tone="muted" label={t('platformPage.multiTenant.visual.assignments') as string} />
                        <Pill tone="primary" label={t('platformPage.multiTenant.visual.roles') as string} />
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:col-span-1 lg:flex lg:items-center lg:justify-center">
                    <div className="h-px w-full bg-gradient-to-r from-ase-primary/40 via-white/10 to-transparent" />
                  </div>

                  <div className="lg:col-span-7">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <OrgCard
                        title={t('platformPage.multiTenant.visual.orgs.orgA') as string}
                        active={active === 'orgA'}
                        onHover={() => setActive('orgA')}
                      />
                      <OrgCard
                        title={t('platformPage.multiTenant.visual.orgs.orgB') as string}
                        active={active === 'orgB'}
                        onHover={() => setActive('orgB')}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-ase-text">
                      {t('platformPage.multiTenant.visual.boundary')}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-ase-primary/80" />
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">
                        {t('platformPage.multiTenant.visual.activeContext')}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ase-text2">
                    {t('platformPage.multiTenant.subtitle')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Pill({ label, tone }: { label: string; tone: 'muted' | 'primary' }) {
  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide',
        tone === 'primary'
          ? 'border-ase-primary/30 bg-ase-primary/10 text-ase-primary'
          : 'border-white/10 bg-white/[0.03] text-ase-text2',
      )}
    >
      {label}
    </div>
  )
}

function OrgCard({ title, active, onHover }: { title: string; active: boolean; onHover: () => void }) {
  const { t } = useI18n()
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-white/[0.04] p-5 backdrop-blur-sm transition',
        active ? 'border-ase-primary/30 ring-1 ring-ase-primary/20' : 'border-white/[0.08] hover:border-white/15',
      )}
      onMouseEnter={onHover}
      onFocus={onHover}
      tabIndex={0}
      role="button"
      aria-label={title}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{title}</div>
        <span className={cn('h-2 w-2 rounded-full', active ? 'bg-ase-primary/90' : 'bg-white/30')} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Mini
          label={t('platformPage.multiTenant.visual.roles') as string}
          value={
            active
              ? (t('platformPage.multiTenant.visual.values.roleAdmin') as string)
              : (t('platformPage.multiTenant.visual.values.roleViewer') as string)
          }
        />
        <Mini
          label={t('platformPage.multiTenant.visual.products') as string}
          value={
            active
              ? (t('platformPage.multiTenant.visual.values.products2') as string)
              : (t('platformPage.multiTenant.visual.values.products1') as string)
          }
        />
        <Mini
          label={t('platformPage.multiTenant.visual.subscriptions') as string}
          value={
            active
              ? (t('platformPage.multiTenant.visual.values.subsActive') as string)
              : (t('platformPage.multiTenant.visual.values.subsTrial') as string)
          }
        />
        <Mini
          label={t('platformPage.multiTenant.visual.assignments') as string}
          value={
            active
              ? (t('platformPage.multiTenant.visual.values.accessScoped') as string)
              : (t('platformPage.multiTenant.visual.values.accessRead') as string)
          }
        />
      </div>
      <div className="pointer-events-none absolute -inset-8 opacity-0 transition duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-tr from-ase-primary/10 via-ase-accent/8 to-transparent blur-2xl" />
      </div>
    </div>
  )
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-ase-bg2/35 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 text-xs font-semibold text-ase-text2">{value}</div>
    </div>
  )
}

