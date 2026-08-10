import { Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'
import { cn } from '../ui/cn'

type Props = {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyCapabilityState({ title, description, actionLabel, onAction, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-[2rem] border border-dashed border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent px-8 py-14 text-center',
        className,
      )}
    >
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/15 to-violet-400/10">
        <Sparkles className="h-8 w-8 text-cyan-200/90" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-ase-text">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ase-text2">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
