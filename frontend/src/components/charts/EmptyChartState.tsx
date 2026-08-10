import { LineChart } from 'lucide-react'
import { cn } from '../ui/cn'

type Props = {
  message: string
  className?: string
}

export function EmptyChartState({ message, className }: Props) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center rounded-2xl bg-ase-bg/40 px-4 text-center backdrop-blur-[1px]',
        className,
      )}
      aria-hidden
    >
      <div className="mb-2 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
        <LineChart className="h-5 w-5 text-ase-muted opacity-80" strokeWidth={1.75} />
      </div>
      <p className="max-w-[220px] text-xs leading-relaxed text-ase-text2">{message}</p>
    </div>
  )
}
