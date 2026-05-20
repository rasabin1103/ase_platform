import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'
import { cn } from '../ui/cn'
import { FeatureStatusBadge } from './FeatureStatusBadge'
import { InfoTooltip } from './InfoTooltip'
import type { CapabilityStatus } from './types'

export type CapabilityCardProps = {
  icon: LucideIcon
  title: string
  description: string
  benefits: string[]
  status: CapabilityStatus
  statusLabel: string
  tooltip: string
  tooltipAriaLabel?: string
  footer?: ReactNode
  className?: string
  accent?: 'cyan' | 'violet' | 'amber'
}

const accentBar: Record<NonNullable<CapabilityCardProps['accent']>, string> = {
  cyan: 'from-cyan-300 to-blue-500',
  violet: 'from-violet-300 to-fuchsia-500',
  amber: 'from-amber-300 to-orange-500',
}

export function CapabilityCard({
  icon: Icon,
  title,
  description,
  benefits,
  status,
  statusLabel,
  tooltip,
  tooltipAriaLabel,
  footer,
  className,
  accent = 'cyan',
}: CapabilityCardProps) {
  return (
    <Card
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border-white/[0.08] bg-ase-surface/60 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur sm:p-7',
        className,
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', accentBar[accent])} />
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/15 to-violet-400/10">
          <Icon className="h-7 w-7 text-cyan-100/95" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="flex items-center gap-2">
          <FeatureStatusBadge status={status} label={statusLabel} />
          <InfoTooltip content={tooltip} label={tooltipAriaLabel} />
        </div>
      </div>
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-ase-text">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ase-text2">{description}</p>
      <ul className="mt-5 flex-1 space-y-2">
        {benefits.map((b) => (
          <li key={b} className="flex gap-2 text-sm text-ase-text2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300/80" aria-hidden />
            {b}
          </li>
        ))}
      </ul>
      {footer ? <div className="mt-6 pt-2">{footer}</div> : null}
    </Card>
  )
}
