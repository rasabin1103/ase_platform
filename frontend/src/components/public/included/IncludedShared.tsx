import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../ui/cn'
import { Reveal, SectionHeading } from '../home/Reveal'

/** Bloque de sección: texto a un lado, visual al otro (alternable). */
export function FeatureSection({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  visual,
  reverse,
  tinted,
}: {
  id: string
  eyebrow: string
  title: string
  subtitle: string
  children?: ReactNode
  visual: ReactNode
  reverse?: boolean
  tinted?: boolean
}) {
  return (
    <section id={id} className={cn('scroll-mt-32 py-20 lg:py-28', tinted && 'bg-ase-bg2/40')}>
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <div className={cn('min-w-0', reverse && 'lg:order-2')}>
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} align="left" />
          {children && (
            <Reveal delayMs={120} className="mt-8">
              {children}
            </Reveal>
          )}
        </div>
        <Reveal delayMs={80} className={cn('min-w-0', reverse && 'lg:order-1')}>
          {visual}
        </Reveal>
      </div>
    </section>
  )
}

/** Lista de ventajas con título y texto, en rejilla de 2 columnas. */
export function FeatureGrid({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
      {items.map((it) => (
        <li key={it.title} className="flex gap-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
            <Check className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-ase-text">{it.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ase-text2">{it.text}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Marco común de los visuales: tarjeta oscura con cabecera tipo ventana. */
export function VisualFrame({
  title,
  badge,
  children,
  className,
}: {
  title: string
  badge?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className="relative">
      <div aria-hidden className="absolute inset-8 -z-10 rounded-[2.5rem] bg-ase-brand/15 blur-3xl" />
      <div
        className={cn(
          'overflow-hidden rounded-3xl border border-white/10 bg-ase-surface/80 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
            </span>
            <span className="text-xs font-semibold text-ase-text2">{title}</span>
          </div>
          {badge}
        </div>
        <div className="p-5 sm:p-7">{children}</div>
      </div>
    </div>
  )
}

export function ExampleNote({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-center text-[11px] uppercase tracking-[0.18em] text-ase-muted/70">{children}</p>
}
