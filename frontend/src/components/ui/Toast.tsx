import { cn } from './cn'

type Props = {
  message: string
  variant?: 'success' | 'error' | 'info'
  onDismiss?: () => void
}

export function Toast({ message, variant = 'info', onDismiss }: Props) {
  const styles =
    variant === 'success'
      ? 'border-ase-success/30 bg-ase-success/10 text-ase-success'
      : variant === 'error'
        ? 'border-ase-error/30 bg-ase-error/10 text-ase-error'
        : 'border-ase-primary/30 bg-ase-primary/10 text-ase-primary'

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm shadow-soft',
        styles,
      )}
      role="status"
    >
      <span>{message}</span>
      {onDismiss ? (
        <button
          type="button"
          className="shrink-0 text-xs font-semibold opacity-80 hover:opacity-100"
          onClick={onDismiss}
        >
          ×
        </button>
      ) : null}
    </div>
  )
}
