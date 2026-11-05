import { AlertTriangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useFlError } from './useFt'


export function ErrorNote({ error }: { error: unknown }) {
  const message = useFlError()(error)
  return (
    <div role="alert" className="flex gap-2.5 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <div>{message}</div>
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-ase-text2">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-ase-muted">{hint}</span> : null}
    </label>
  )
}

export function Stat({ label, value, hint, strong }: { label: string; value: string; hint?: string; strong?: boolean }) {
  return (
    <div className="rounded-xl border border-ase-border bg-ase-surface p-4">
      <div className="text-xs uppercase tracking-wide text-ase-muted">{label}</div>
      <div className={strong ? 'mt-1 text-2xl font-semibold text-ase-text' : 'mt-1 text-lg font-medium text-ase-text'}>{value}</div>
      {hint ? <div className="mt-1 text-xs text-ase-muted">{hint}</div> : null}
    </div>
  )
}

