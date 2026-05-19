import type { ButtonHTMLAttributes } from 'react'
import { cn } from './cn'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked: boolean
  onCheckedChange: (next: boolean) => void
  label?: string
}

export function Switch({ checked, onCheckedChange, label, className, ...props }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ase-text2 backdrop-blur',
        'transition hover:bg-white/[0.05] hover:border-white/15',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ase-primary/50',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'relative h-6 w-11 rounded-full border border-white/10 bg-black/30 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition',
          checked && 'bg-ase-primary/35 border-ase-primary/30',
        )}
      >
        <span
          className={cn(
            'absolute top-1/2 left-1 h-4 w-4 -translate-y-1/2 rounded-full bg-white/70 shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition',
            checked && 'translate-x-5 bg-white',
          )}
        />
      </span>
      {label ? <span className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{label}</span> : null}
    </button>
  )
}

