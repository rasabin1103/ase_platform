import type { ReactNode } from 'react'
import { cn } from '../../../components/ui/cn'

export function RequiredMark() {
  return <span className="text-ase-error"> *</span>
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-ase-error">{message}</p>
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[11px] leading-snug text-ase-muted">{children}</p>
}

/** Etiqueta + control + ayuda + error: el patrón que repite cada campo. */
export function Field({
  label,
  required,
  hint,
  error,
  wide,
  aside,
  children,
}: {
  label: ReactNode
  required?: boolean
  hint?: ReactNode
  error?: unknown
  /** Ocupa las dos columnas de la rejilla. */
  wide?: boolean
  /** Contenido a la derecha de la etiqueta (p. ej. un enlace). */
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <label className={cn('block', wide && 'sm:col-span-2')}>
      <span className="mb-1 flex items-center justify-between gap-2 text-xs text-ase-muted">
        <span>
          {label}
          {required ? <RequiredMark /> : null}
        </span>
        {aside}
      </span>
      {children}
      {hint ? <Hint>{hint}</Hint> : null}
      <FieldError message={typeof error === 'string' ? error : undefined} />
    </label>
  )
}

/** Bloque de campos relacionados dentro de una sección (p. ej. «Canje del libro»). */
export function SubGroup({ title, hint, children }: { title: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:col-span-2">
      <span className="block text-xs font-semibold uppercase tracking-wide text-ase-muted">{title}</span>
      {hint ? <p className="text-[11px] leading-snug text-ase-muted">{hint}</p> : null}
      {children}
    </div>
  )
}

/** Sección numerada del formulario, con ancla para la navegación superior. */
export function FormSection({
  id,
  index,
  title,
  hint,
  hasError,
  children,
}: {
  id: string
  index: number
  title: string
  hint: string
  hasError?: boolean
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-white/10 pt-6 first:border-t-0 first:pt-0">
      <header className="mb-4 flex items-start gap-3">
        <span
          className={cn(
            'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold',
            hasError ? 'bg-ase-error/15 text-ase-error ring-1 ring-ase-error/40' : 'bg-ase-brand/15 text-sky-300 ring-1 ring-ase-brand/30',
          )}
        >
          {index}
        </span>
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight text-ase-text">{title}</h3>
          <p className="mt-0.5 text-xs text-ase-muted">{hint}</p>
        </div>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}
