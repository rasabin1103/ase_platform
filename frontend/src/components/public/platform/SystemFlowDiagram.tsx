import { useId, useMemo, useState } from 'react'
import { tStringArray, useI18n } from '../../../i18n'
import { Badge } from '../../ui/Badge'
import { cn } from '../../ui/cn'

type NodeId = 'user' | 'org' | 'rbac' | 'catalog' | 'subs' | 'ops' | 'audit'

const NODES: NodeId[] = ['user', 'org', 'rbac', 'catalog', 'subs', 'ops', 'audit']

const ICONS: Record<NodeId, string> = {
  user: '◉',
  org: '⬡',
  rbac: '▣',
  catalog: '◇',
  subs: '◈',
  ops: '⊞',
  audit: '○',
}

export function SystemFlowDiagram() {
  const { t } = useI18n()
  const gid = useId().replace(/:/g, '')
  const gradId = `sys-flow-${gid}`
  const [active, setActive] = useState<NodeId | null>(null)

  const nodes = useMemo(
    () =>
      NODES.map((id) => ({
        id,
        icon: ICONS[id],
        title: t(`platformPage.diagram.nodes.${id}.title`) as string,
        description: t(`platformPage.diagram.nodes.${id}.description`) as string,
        micro: tStringArray(t, `platformPage.diagram.nodes.${id}.micro`),
      })),
    [t],
  )

  return (
    <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(56,189,248,0.10),transparent_58%)]" />

      <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <Badge variant="info" className="border-white/10 bg-white/[0.04] text-ase-text2">
            {t('platformPage.diagram.badge')}
          </Badge>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl">
            {t('platformPage.diagram.title')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg">{t('platformPage.diagram.subtitle')}</p>
        </div>

        {/* Desktop flow */}
        <div className="relative mt-14 hidden lg:block">
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 26" aria-hidden>
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(56,189,248)" stopOpacity="0.0" />
                <stop offset="30%" stopColor="rgb(56,189,248)" stopOpacity="0.35" />
                <stop offset="70%" stopColor="rgb(34,211,238)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="rgb(248,250,252)" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {nodes.slice(0, -1).map((n, i) => {
              const x1 = 7 + i * 14
              const x2 = x1 + 14
              const isOn = active === null || active === n.id || active === nodes[i + 1]!.id
              return (
                <line
                  key={`line-${n.id}`}
                  x1={x1 + 6}
                  y1="13"
                  x2={x2 - 6}
                  y2="13"
                  stroke={`url(#${gradId})`}
                  strokeWidth="0.5"
                  className={cn('transition duration-300', isOn ? 'opacity-70' : 'opacity-20')}
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </svg>

          <div className="grid grid-cols-7 gap-5">
            {nodes.map((n) => {
              const isOn = active === null || active === n.id
              return (
                <button
                  key={n.id}
                  type="button"
                  className={cn(
                    'relative overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.04] p-4 text-left shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md transition duration-300',
                    'hover:border-ase-primary/30 hover:bg-white/[0.06]',
                    isOn ? 'opacity-100' : 'opacity-[0.45]',
                    active === n.id && 'ring-1 ring-ase-primary/25',
                  )}
                  onMouseEnter={() => setActive(n.id)}
                  onMouseLeave={() => setActive(null)}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-ase-bg2/60 text-sm text-ase-text">
                      {n.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{n.title}</div>
                      <p className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-ase-text2">{n.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {n.micro.map((m, i) => (
                      <span
                        key={`${n.id}-m-${i}`}
                        className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ase-muted"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  <div className="pointer-events-none absolute -inset-10 opacity-0 transition duration-300 hover:opacity-100" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Mobile flow */}
        <div className="mt-12 lg:hidden">
          <div className="relative mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-white/[0.08] bg-ase-surface/45 p-5 backdrop-blur-md sm:p-6">
            <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px]" />
            <ol className="relative z-[1] space-y-4">
              {nodes.map((n, idx) => (
                <li key={n.id} className="relative">
                  <button
                    type="button"
                    className={cn(
                      'w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-left backdrop-blur-sm transition',
                      active === n.id && 'border-ase-primary/35 ring-1 ring-ase-primary/20',
                    )}
                    onClick={() => setActive((cur) => (cur === n.id ? null : n.id))}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-ase-bg2/60 text-sm text-ase-text">
                        {n.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{n.title}</div>
                        <p className="mt-1.5 text-[11px] leading-snug text-ase-text2">{n.description}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {n.micro.map((m, i) => (
                        <span
                          key={`${n.id}-mm-${i}`}
                          className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ase-muted"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </button>
                  {idx < nodes.length - 1 ? (
                    <div className="pointer-events-none mx-auto my-2 h-6 w-px bg-gradient-to-b from-ase-primary/35 via-white/10 to-transparent" />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

