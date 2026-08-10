import { Check, Clock, X } from 'lucide-react'
import { Card } from '../ui/Card'
import { FeatureStatusBadge } from './FeatureStatusBadge'
import { cn } from '../ui/cn'
import type { CapabilityStatus } from './types'

type Props = {
  title: string
  typeLabel: string
  targetLabel: string
  status: string
  statusLabel: string
  submittedAt: string
  message?: string | null
  adminNotes?: string | null
  yourMessageLabel: string
  teamNoteLabel: string
  submittedLabel: string
  timelinePending: string
  timelineApproved: string
  timelineRejected: string
  footer?: React.ReactNode
  className?: string
}

function mapRequestStatus(status: string): CapabilityStatus {
  if (status === 'pending') return 'pending'
  if (status === 'approved') return 'active'
  if (status === 'rejected') return 'restricted'
  return 'available'
}

export function AccessRequestTimelineCard({
  title,
  typeLabel,
  targetLabel,
  status,
  statusLabel,
  submittedAt,
  message,
  adminNotes,
  yourMessageLabel,
  teamNoteLabel,
  submittedLabel,
  timelinePending,
  timelineApproved,
  timelineRejected,
  footer,
  className,
}: Props) {
  const capStatus = mapRequestStatus(status)
  const TimelineIcon =
    status === 'approved' ? Check : status === 'rejected' ? X : Clock
  const timelineText =
    status === 'approved'
      ? timelineApproved
      : status === 'rejected'
        ? timelineRejected
        : timelinePending

  return (
    <Card
      className={cn(
        'rounded-[1.5rem] border-white/[0.08] bg-ase-surface/55 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.28)] backdrop-blur sm:p-6',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-ase-text">{title}</h3>
          <p className="mt-1 text-sm text-ase-text2">
            {typeLabel} · {targetLabel}
          </p>
        </div>
        <FeatureStatusBadge status={capStatus} label={statusLabel} />
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
          <TimelineIcon className="h-4 w-4 text-ase-muted" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ase-muted">{timelineText}</p>
          <p className="text-sm text-ase-text2">
            {submittedLabel}: {submittedAt}
          </p>
        </div>
      </div>

      {message ? (
        <p className="mt-4 text-sm leading-relaxed text-ase-text2">
          <span className="font-medium text-ase-muted">{yourMessageLabel}: </span>
          {message}
        </p>
      ) : null}
      {adminNotes ? (
        <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/5 px-4 py-3 text-sm text-amber-100/90">
          <span className="font-medium">{teamNoteLabel}: </span>
          {adminNotes}
        </p>
      ) : null}

      {footer ? <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-white/[0.06] pt-5">{footer}</div> : null}
    </Card>
  )
}
