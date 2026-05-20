import { Info } from 'lucide-react'
import { cn } from '../ui/cn'

type Props = {
  content: string
  className?: string
  label?: string
}

export function InfoTooltip({ content, className, label = 'More information' }: Props) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-ase-muted transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
        aria-label={label}
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-ase-bg2/95 px-4 py-3 text-xs leading-relaxed text-ase-text2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {content}
      </span>
    </span>
  )
}
