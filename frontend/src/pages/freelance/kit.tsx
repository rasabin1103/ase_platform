import type { LucideIcon } from 'lucide-react'
import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '../../components/ui/cn'

/** Bloque con título que se puede plegar. Abierto por defecto; el título es el botón. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  defaultOpen = true,
}: {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  if (!title) {
    return <section className={cn('rounded-2xl border border-ase-border bg-ase-surface p-5 shadow-soft', className)}>{children}</section>
  }
  return (
    <section
      className={cn(
        'rounded-2xl border bg-ase-surface p-5 shadow-soft transition-colors',
        open ? 'border-ase-border' : 'border-ase-border/60',
        className,
      )}
    >
      <header className={cn('flex flex-wrap items-start justify-between gap-2', open && 'mb-4')}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={id}
          className="group flex min-w-0 items-start gap-2 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ase-brand/60"
        >
          <ChevronDown
            className={cn('mt-0.5 h-4 w-4 shrink-0 text-ase-muted transition-transform duration-200 group-hover:text-ase-text motion-reduce:transition-none', !open && '-rotate-90')}
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>
            <span className="block text-sm font-semibold text-ase-text">{title}</span>
            {subtitle ? <span className="mt-0.5 block text-xs text-ase-muted">{subtitle}</span> : null}
          </span>
        </button>
        {open ? action : null}
      </header>
      <div id={id} hidden={!open}>
        {children}
      </div>
    </section>
  )
}

type Tone = 'neutral' | 'good' | 'warn' | 'bad'
const TONE: Record<Tone, string> = {
  neutral: 'text-ase-text',
  good: 'text-emerald-300',
  warn: 'text-amber-300',
  bad: 'text-rose-300',
}

export function Kpi({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint?: string
  icon?: LucideIcon
  tone?: Tone
}) {
  return (
    <div className="rounded-2xl border border-ase-border bg-ase-surface p-4">
      <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wide text-ase-muted">
        <span>{label}</span>
        {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.75} aria-hidden="true" /> : null}
      </div>
      <div className={cn('mt-1.5 text-xl font-semibold tabular-nums', TONE[tone])}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-ase-muted">{hint}</div> : null}
    </div>
  )
}

export function Pill({ tone = 'neutral', children }: { tone?: Tone | 'info'; children: ReactNode }) {
  const styles: Record<string, string> = {
    neutral: 'border-ase-border text-ase-text2',
    good: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
    warn: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    bad: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
    info: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  }
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', styles[tone])}>{children}</span>
}

/** Barra apilada que reparte un total en partes con su leyenda. */
export function SplitBar({ parts }: { parts: Array<{ label: string; value: number; color: string; display: string }> }) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0)
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5" role="img" aria-label={parts.map((p) => `${p.label}: ${p.display}`).join(', ')}>
        {total > 0
          ? parts.map((p) =>
              p.value > 0 ? <div key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} /> : null,
            )
          : null}
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center justify-between gap-3 text-ase-text2">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} aria-hidden="true" />
              {p.label}
            </span>
            <span className="tabular-nums text-ase-text">{p.display}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-ase-border bg-ase-surface p-3">{children}</div>
}
