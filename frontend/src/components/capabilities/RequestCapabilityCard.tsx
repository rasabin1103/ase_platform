import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import { CapabilityCard, type CapabilityCardProps } from './CapabilityCard'
import type { CapabilityStatus } from './types'

type Props = Omit<CapabilityCardProps, 'footer'> & {
  ctaLabel: string
  onCta?: () => void
  ctaHref?: string
  ctaDisabled?: boolean
  ctaVariant?: 'primary' | 'secondary' | 'outline' | 'ghost'
}

function ctaForStatus(status: CapabilityStatus, labels: {
  request: string
  active: string
  pending: string
  restricted: string
}): { label: string; disabled: boolean; variant: 'primary' | 'outline' | 'ghost' } {
  switch (status) {
    case 'active':
      return { label: labels.active, disabled: false, variant: 'secondary' as const }
    case 'pending':
      return { label: labels.pending, disabled: true, variant: 'outline' as const }
    case 'coming_soon':
      return { label: labels.active, disabled: true, variant: 'outline' as const }
    case 'restricted':
      return { label: labels.restricted, disabled: true, variant: 'outline' as const }
    default:
      return { label: labels.request, disabled: false, variant: 'primary' as const }
  }
}

export function RequestCapabilityCard({
  status,
  ctaLabel,
  onCta,
  ctaHref,
  ctaDisabled,
  ctaVariant,
  ...card
}: Props) {
  const resolved = ctaVariant
    ? { label: ctaLabel, disabled: Boolean(ctaDisabled), variant: ctaVariant }
    : { label: ctaLabel, disabled: Boolean(ctaDisabled), variant: 'primary' as const }

  const footer = ctaHref && !resolved.disabled ? (
    <Link to={ctaHref}>
      <Button className="w-full sm:w-auto" variant={resolved.variant === 'secondary' ? 'secondary' : 'primary'}>
        {resolved.label}
      </Button>
    </Link>
  ) : (
    <Button
      className="w-full sm:w-auto"
      variant={resolved.variant === 'secondary' ? 'secondary' : resolved.variant}
      disabled={resolved.disabled}
      onClick={onCta}
    >
      {resolved.label}
    </Button>
  )

  return <CapabilityCard {...card} status={status} footer={footer} />
}

export function resolveCapabilityCta(
  status: CapabilityStatus,
  labels: { request: string; active: string; pending: string; restricted: string },
) {
  return ctaForStatus(status, labels)
}
