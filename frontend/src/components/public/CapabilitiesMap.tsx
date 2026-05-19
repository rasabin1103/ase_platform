import { useId, useMemo, useState } from 'react'
import { tStringArray, useI18n } from '../../i18n'
import { Badge } from '../ui/Badge'
import { cn } from '../ui/cn'

const NODE_IDS = ['saas', 'qa', 'rbac', 'billing', 'training', 'frameworks', 'books', 'ai', 'dashboards', 'audit'] as const

type NodeId = (typeof NODE_IDS)[number]

const ICONS: Record<NodeId, string> = {
  saas: '◇',
  qa: '◆',
  rbac: '▣',
  billing: '◈',
  training: '◎',
  frameworks: '⬡',
  books: '▤',
  ai: '✦',
  dashboards: '⊞',
  audit: '○',
}

function polarPct(index: number, total: number, radiusPct: number): { left: number; top: number } {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / total
  return {
    left: 50 + radiusPct * Math.cos(angle),
    top: 50 + radiusPct * Math.sin(angle),
  }
}

export function CapabilitiesMap() {
  const { t } = useI18n()
  const gid = useId().replace(/:/g, '')
  const gradId = `cap-map-grad-${gid}`
  const [hovered, setHovered] = useState<NodeId | null>(null)

  const nodes = useMemo(
    () =>
      NODE_IDS.map((id, i) => {
        const pos = polarPct(i, NODE_IDS.length, 38)
        const highlights = tStringArray(t, `servicesPage.capabilities.items.${id}.highlights`)
        return {
          id,
          icon: ICONS[id],
          title: t(`servicesPage.capabilities.items.${id}.title`) as string,
          description: t(`servicesPage.capabilities.items.${id}.description`) as string,
          highlights,
          ...pos,
        }
      }),
    [t],
  )

  const active = hovered ? nodes.find((n) => n.id === hovered) : null

  return (
    <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_20%,rgba(56,189,248,0.09),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ase-bg2/80 to-transparent" />

      <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <Badge variant="info" className="border-ase-primary/25 bg-ase-primary/10 text-ase-primary">
            {t('servicesPage.capabilities.badge')}
          </Badge>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl lg:text-[2.5rem]">
            {t('servicesPage.capabilities.title')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg lg:text-xl">
            {t('servicesPage.capabilities.subtitle')}
          </p>
        </div>

        {/* Desktop: orbital map + detail panel */}
        <div className="relative mt-14 hidden lg:grid lg:grid-cols-[minmax(0,1fr)_min(17.5rem,22vw)] lg:items-start lg:gap-10 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-12">
          <div className="relative min-h-[580px] lg:min-h-[640px]">
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
            >
              <defs>
                <linearGradient id={gradId} x1="50%" y1="50%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(56,189,248)" stopOpacity="0.35" />
                  <stop offset="55%" stopColor="rgb(34,211,238)" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="rgb(248,250,252)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {nodes.map((n) => {
                const activeLine = hovered === null || hovered === n.id
                return (
                  <line
                    key={n.id}
                    x1="50"
                    y1="50"
                    x2={n.left}
                    y2={n.top}
                    stroke={`url(#${gradId})`}
                    strokeWidth="0.35"
                    vectorEffect="non-scaling-stroke"
                    className={cn(
                      'transition duration-500 ease-out',
                      activeLine ? 'opacity-[0.55]' : 'opacity-[0.12]',
                      hovered === n.id && 'opacity-100',
                    )}
                  />
                )
              })}
            </svg>

            {/* Core hub */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-[2] w-[min(92%,20rem)] -translate-x-1/2 -translate-y-1/2">
              <div className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-ase-primary/10 blur-3xl motion-safe:animate-cap-glow" />
              <div
                className={cn(
                  'relative overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-white/[0.06] p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_28px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl motion-safe:animate-cap-float',
                  hovered && 'border-ase-primary/25 bg-white/[0.08]',
                )}
              >
              <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px]" />
              <div className="relative z-[1] mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-ase-primary/30 bg-ase-primary/15 text-lg text-ase-primary shadow-[0_0_32px_rgba(56,189,248,0.25)]">
                {t('servicesPage.visuals.capabilityCoreSymbol')}
              </div>
              <div className="relative z-[1] text-lg font-extrabold tracking-tight text-ase-text">
                {t('servicesPage.capabilities.coreTitle')}
              </div>
              <div className="relative z-[1] mt-2 text-xs font-medium uppercase tracking-wide text-ase-muted">
                {t('servicesPage.capabilities.coreSubtitle')}
              </div>
              <div className="relative z-[1] mt-4 flex justify-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-ase-accent/80 shadow-[0_0_12px_rgba(34,211,238,0.35)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-ase-primary/70" />
                <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
              </div>
              </div>
            </div>

          {/* Satellites */}
          {nodes.map((n) => {
            const isOn = hovered === null || hovered === n.id
            return (
              <button
                key={n.id}
                type="button"
                style={{ left: `${n.left}%`, top: `${n.top}%` }}
                className={cn(
                  'absolute z-[3] w-[min(12.5rem,18vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white/[0.05] p-4 text-left shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md transition duration-300',
                  'border-white/[0.1] hover:-translate-y-[calc(50%+2px)] hover:border-ase-primary/35 hover:bg-white/[0.09] hover:shadow-[0_20px_60px_rgba(0,0,0,0.55)]',
                  isOn ? 'opacity-100' : 'opacity-[0.35]',
                  hovered === n.id && 'scale-[1.03] border-ase-primary/40 opacity-100 ring-1 ring-ase-primary/25',
                )}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-start gap-2.5">
                  <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-ase-bg2/60 text-sm text-ase-text">
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-ase-accent/90 shadow-[0_0_10px_rgba(34,211,238,0.45)] motion-safe:animate-pulse" />
                    {n.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{n.title}</div>
                    <div className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-ase-text2">{n.description}</div>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {n.highlights.map((h, hi) => (
                    <span
                      key={`${n.id}-h-${hi}`}
                      className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ase-muted"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
          </div>

          <aside className="relative z-[4] lg:pt-6">
            <div
              className={cn(
                'sticky top-28 overflow-hidden rounded-2xl border border-white/[0.1] bg-ase-surface/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl transition duration-300',
                active && 'border-ase-primary/25 shadow-[0_0_0_1px_rgba(56,189,248,0.12),0_24px_70px_rgba(0,0,0,0.55)]',
              )}
            >
              <div className="text-[10px] font-semibold uppercase tracking-widest text-ase-muted">
                {active ? active.title : (t('servicesPage.capabilities.panelDefaultTitle') as string)}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ase-text2">
                {active ? active.description : (t('servicesPage.capabilities.panelHint') as string)}
              </p>
              {active ? (
                <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {active.highlights.map((h, hi) => (
                    <li key={`panel-${active.id}-${hi}`} className="flex gap-2 text-xs text-ase-text2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ase-accent/80" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </aside>
        </div>

        {/* Mobile / tablet: stacked ecosystem */}
        <div className="mt-12 space-y-6 lg:hidden">
          <div className="relative mx-auto max-w-md overflow-hidden rounded-[1.75rem] border border-white/[0.1] bg-white/[0.05] p-6 text-center shadow-[0_20px_70px_rgba(0,0,0,0.5)] backdrop-blur-md">
            <div className="pointer-events-none absolute -inset-10 bg-ase-primary/10 blur-3xl" />
            <div className="relative z-[1] mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-ase-primary/30 bg-ase-primary/15 text-lg text-ase-primary">
              {t('servicesPage.visuals.capabilityCoreSymbol')}
            </div>
            <div className="relative z-[1] mt-3 text-lg font-extrabold text-ase-text">
              {t('servicesPage.capabilities.coreTitle')}
            </div>
            <p className="relative z-[1] mt-2 text-xs uppercase tracking-wide text-ase-muted">
              {t('servicesPage.capabilities.coreSubtitle')}
            </p>
          </div>

          <div className="relative mx-auto max-w-lg">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-ase-primary/40 via-white/10 to-transparent sm:left-6" />
            <div className="space-y-4 pl-10 sm:pl-12">
              {nodes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={cn(
                    'relative w-full rounded-2xl border border-white/[0.08] bg-ase-surface/60 p-4 text-left shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition',
                    hovered === n.id && 'border-ase-primary/35 bg-white/[0.06] ring-1 ring-ase-primary/20',
                  )}
                  onClick={() => setHovered((cur) => (cur === n.id ? null : n.id))}
                >
                  <span className="absolute -left-[1.35rem] top-5 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-xl border border-white/10 bg-ase-bg2 text-xs text-ase-text sm:-left-[1.6rem]">
                    {n.icon}
                  </span>
                  <div className="text-sm font-bold text-ase-text">{n.title}</div>
                  <p className="mt-2 text-xs leading-relaxed text-ase-text2">{n.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {n.highlights.map((h, hi) => (
                      <span
                        key={`${n.id}-m-${hi}`}
                        className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ase-muted"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
