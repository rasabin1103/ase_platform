import { Check, Clock, Lock, Sparkles, Timer } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { cn } from '../ui/cn'
import type { CapabilityStatus } from './types'

const STATUS_ICON: Record<CapabilityStatus, typeof Sparkles> = {
  available: Sparkles,
  active: Check,
  pending: Clock,
  restricted: Lock,
  coming_soon: Timer,
}

const STATUS_VARIANT: Record<
  CapabilityStatus,
  'default' | 'info' | 'success' | 'warning' | 'error'
> = {
  available: 'info',
  active: 'success',
  pending: 'warning',
  restricted: 'default',
  coming_soon: 'info',
}

type Props = {
  status: CapabilityStatus
  label: string
  className?: string
  showIcon?: boolean
}

export function FeatureStatusBadge({ status, label, className, showIcon = true }: Props) {
  const Icon = STATUS_ICON[status]
  const variant = STATUS_VARIANT[status]

  return (
    <Badge variant={variant} className={cn('gap-1.5 px-3 py-1 text-xs font-semibold', className)}>
      {showIcon ? <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden /> : null}
      {label}
    </Badge>
  )
}
