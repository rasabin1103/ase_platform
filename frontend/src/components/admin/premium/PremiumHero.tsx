import type { ReactNode } from 'react'
import { cn } from '../../ui/cn'
import { HERO_ACCENTS, ADMIN_HERO_SECTION, ADMIN_HERO_SUBTITLE, ADMIN_HERO_TITLE } from './adminHeroStyles'

/** Marcador editorial (línea + etiqueta) de las cabeceras del admin. */
export function AdminEyebrow({
  children,
  accent = 'cyan',
  className,
}: {
  children: ReactNode
  accent?: keyof typeof HERO_ACCENTS
  className?: string
}) {
  const a = HERO_ACCENTS[accent]
  return (
    <div className={cn('inline-flex items-center gap-2.5', className)}>
      <span className={cn('h-px w-8', a.line)} />
      <span className={cn('text-label font-semibold uppercase', a.eyebrow)}>{children}</span>
    </div>
  )
}

export function AdminHeroHalo({ accent = 'cyan' }: { accent?: keyof typeof HERO_ACCENTS }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full blur-[90px]',
        HERO_ACCENTS[accent].halo,
      )}
    />
  )
}

export function PremiumHero({
  badge,
  title,
  subtitle,
  contextChips,
  actions,
  sidePanel,
  leading,
  accent = 'cyan',
  compact = false,
}: {
  badge: string
  title: string
  subtitle: string
  contextChips?: ReactNode
  actions?: ReactNode
  sidePanel?: ReactNode
  /** Optional slot rendered above everything else (e.g. the account avatar + greeting),
   * so it's the first, most prominent thing in the header. */
  leading?: ReactNode
  accent?: keyof typeof HERO_ACCENTS
  /** Cabecera más baja para páginas de listado (catálogos, biblioteca…). */
  compact?: boolean
}) {
  return (
    <section className={compact ? ADMIN_HERO_SECTION.replace('md:p-8', 'md:p-6') : ADMIN_HERO_SECTION}>
      <AdminHeroHalo accent={accent} />
      <div
        className={cn(
          'relative grid gap-6',
          compact ? 'lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end' : 'gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center',
        )}
      >
        <div>
          {leading ? <div className="mb-5">{leading}</div> : null}
          <AdminEyebrow accent={accent} className="mb-4">
            {badge}
          </AdminEyebrow>
          <h1 className={compact ? ADMIN_HERO_TITLE.replace('text-3xl', 'text-2xl').replace('md:text-4xl', 'md:text-3xl') : ADMIN_HERO_TITLE}>{title}</h1>
          <p className={compact ? ADMIN_HERO_SUBTITLE.replace('mt-3', 'mt-2') : ADMIN_HERO_SUBTITLE}>{subtitle}</p>
          {contextChips ? <div className="mt-6 flex flex-wrap items-center gap-3">{contextChips}</div> : null}
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {sidePanel}
      </div>
    </section>
  )
}
