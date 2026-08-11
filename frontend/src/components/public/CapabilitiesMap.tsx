import { tStringArray, useI18n } from '../../i18n'
import { Eyebrow } from '../ui/Eyebrow'

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

export function CapabilitiesMap() {
  const { t } = useI18n()

  const nodes = NODE_IDS.map((id) => ({
    id,
    icon: ICONS[id],
    title: t(`servicesPage.capabilities.items.${id}.title`) as string,
    description: t(`servicesPage.capabilities.items.${id}.description`) as string,
    highlights: tStringArray(t, `servicesPage.capabilities.items.${id}.highlights`),
  }))

  return (
    <section className="relative border-t border-white/[0.06] py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_20%,rgba(56,189,248,0.09),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ase-bg2/80 to-transparent" />

      <div className="relative mx-auto w-full max-w-[min(100%,1440px)] px-5 sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <Eyebrow>{t('servicesPage.capabilities.badge')}</Eyebrow>
          <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ase-text sm:text-4xl lg:text-[2.5rem]">
            {t('servicesPage.capabilities.title')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ase-text2 sm:text-lg lg:text-xl">
            {t('servicesPage.capabilities.subtitle')}
          </p>
        </div>

        {/* Core hub banner */}
        <div className="relative mt-12 overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-white/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_28px_90px_rgba(0,0,0,0.55)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="relative z-[1] flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-ase-primary/30 bg-ase-primary/15 text-xl text-ase-primary shadow-[0_0_32px_rgba(56,189,248,0.25)]">
              {t('servicesPage.visuals.capabilityCoreSymbol')}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-extrabold tracking-tight text-ase-text">
                {t('servicesPage.capabilities.coreTitle')}
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-ase-muted">
                {t('servicesPage.capabilities.coreSubtitle')}
              </div>
            </div>
            <div className="flex justify-center gap-2 sm:ml-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-ase-accent/80 shadow-[0_0_12px_rgba(34,211,238,0.35)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-ase-primary/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/30" />
            </div>
          </div>
        </div>

        {/* Capability grid — deterministic responsive grid, never overlaps regardless of viewport */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {nodes.map((n) => (
            <div
              key={n.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-ase-surface p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-ase-primary/35 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-start gap-2.5">
                <span className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-ase-bg2/60 text-sm text-ase-text">
                  <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-ase-accent/90 shadow-[0_0_10px_rgba(34,211,238,0.45)]" />
                  {n.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wide text-ase-text">{n.title}</div>
                  <p className="mt-1.5 line-clamp-3 text-[11px] leading-snug text-ase-text2">{n.description}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {n.highlights.map((h, hi) => (
                  <span
                    key={`${n.id}-h-${hi}`}
                    className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ase-muted"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
