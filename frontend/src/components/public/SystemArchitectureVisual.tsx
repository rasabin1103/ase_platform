import { useId } from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { cn } from '../ui/cn'

type NodeProps = {
  label: string
  tone?: 'primary' | 'accent' | 'muted'
  className?: string
  compact?: boolean
}

function Node({ label, tone = 'muted', className, compact }: NodeProps) {
  const dot =
    tone === 'primary'
      ? 'bg-ase-primary shadow-[0_0_14px_rgba(56,189,248,0.28)]'
      : tone === 'accent'
        ? 'bg-ase-accent shadow-[0_0_14px_rgba(34,211,238,0.22)]'
        : 'bg-white/40'

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-sm',
        'transition duration-200 hover:border-white/12 hover:bg-white/[0.045]',
        compact ? 'px-3 py-2.5' : 'px-3.5 py-3 sm:px-4 sm:py-3.5',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 sm:gap-3">
        <span className={cn('h-2 w-2 shrink-0 rounded-full sm:h-2.5 sm:w-2.5', dot)} />
        <div className="min-w-0 text-sm font-semibold leading-snug text-ase-text">{label}</div>
      </div>
      {!compact && (
        <div className="mt-1 pl-[1.375rem] text-[11px] leading-snug text-ase-muted sm:text-xs">Module</div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition duration-200 group-hover:opacity-100">
        <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-ase-primary/8 via-ase-accent/6 to-transparent blur-xl" />
      </div>
    </div>
  )
}

function HubLines() {
  const gid = useId().replace(/:/g, '')
  const gradId = `arch-line-${gid}`
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 h-full w-full text-white/[0.1]"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="38%" stopColor="currentColor" stopOpacity="0.5" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path d="M 50 52 L 18 18" fill="none" stroke={`url(#${gradId})`} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      <path d="M 50 52 L 50 14" fill="none" stroke={`url(#${gradId})`} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      <path d="M 50 52 L 82 18" fill="none" stroke={`url(#${gradId})`} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      <path d="M 50 52 L 20 78" fill="none" stroke={`url(#${gradId})`} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      <path d="M 50 52 L 50 88" fill="none" stroke={`url(#${gradId})`} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      <path d="M 50 52 L 80 78" fill="none" stroke={`url(#${gradId})`} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function CorePanel({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'relative z-[1] rounded-2xl border border-white/[0.08] bg-white/[0.04] text-center backdrop-blur-sm',
        compact ? 'px-4 py-4' : 'px-4 py-4 sm:px-5 sm:py-5',
      )}
    >
      <div className="mx-auto mb-2.5 h-8 w-8 rounded-xl bg-ase-primary/12 shadow-[0_0_20px_rgba(56,189,248,0.18)] sm:mb-3 sm:h-9 sm:w-9 sm:rounded-2xl" />
      <div className="text-sm font-semibold text-ase-text">ASE Platform Core</div>
      <div className="mt-1 text-xs leading-snug text-ase-muted sm:text-[13px]">
        Policies · Events · APIs · Observability
      </div>
      <div className={cn('mt-3 grid gap-2 sm:mt-4', compact ? 'grid-cols-3' : 'grid-cols-3 gap-2 sm:gap-2.5')}>
        <MiniMetric label="Latency" value="82ms" />
        <MiniMetric label="Policies" value="12" />
        <MiniMetric label="Tenants" value="1" />
      </div>
    </div>
  )
}

export function SystemArchitectureVisual() {
  return (
    <div className="relative w-full min-w-0">
      <div className="pointer-events-none absolute -inset-6 rounded-[28px] bg-gradient-to-tr from-ase-primary/10 via-ase-accent/8 to-transparent blur-2xl sm:-inset-8" />
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-ase-primary/10 blur-3xl sm:h-48 sm:w-48" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 rounded-full bg-ase-accent/8 blur-3xl sm:h-44 sm:w-44" />

      <Card
        interactive
        className={cn(
          'relative overflow-hidden rounded-2xl border-white/[0.06] bg-ase-surface/45 p-4 backdrop-blur-md sm:p-5 lg:p-6',
          'shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_16px_48px_rgba(0,0,0,0.45)]',
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-ase-text">System architecture preview</div>
            <div className="mt-0.5 text-xs leading-relaxed text-ase-text2 sm:text-sm">
              SaaS Core · Auth · RBAC · Billing · Products · Audit
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Badge variant="info" className="border-white/10 bg-white/[0.04] text-xs text-ase-text2 sm:text-[13px]">
              Multi-tenant
            </Badge>
            <Badge variant="info" className="border-ase-primary/25 bg-ase-primary/8 text-xs sm:text-[13px]">
              RBAC-ready
            </Badge>
          </div>
        </div>

        {/* Mobile / tablet: compact stack */}
        <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent lg:hidden">
          <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div className="relative z-[1] space-y-4 p-4 sm:p-5">
            <CorePanel compact />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3">
              <Node label="Auth" tone="primary" compact />
              <Node label="RBAC" tone="accent" compact />
              <Node label="Billing" compact />
              <Node label="Products" compact />
              <Node label="Organizations" compact />
              <Node label="Audit" compact />
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ase-muted">Activity</span>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ase-accent/70 shadow-[0_0_12px_rgba(34,211,238,0.2)]" />
              </div>
              <div className="mt-2 space-y-1.5">
                <FeedRow label="Token issued" meta="2m" />
                <FeedRow label="Role linked" meta="9m" />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: grid + hub lines — no overlapping absolutes */}
        <div className="relative mt-5 hidden min-h-[400px] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(56,189,248,0.08),transparent_55%)] lg:block lg:min-h-[420px] xl:min-h-[440px]">
          <div className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px]" />

          <div className="relative z-[2] grid min-h-[400px] grid-cols-3 grid-rows-[auto_1fr_auto] gap-x-6 gap-y-7 px-5 pb-6 pt-5 xl:min-h-[420px] xl:gap-x-8 xl:gap-y-8 xl:px-6 xl:pb-7 xl:pt-6">
            <div className="col-start-1 row-start-1 self-end justify-self-start">
              <Node label="Auth" tone="primary" className="w-full max-w-[200px]" />
            </div>
            <div className="col-start-2 row-start-1 justify-self-center self-end">
              <Node label="Products" className="w-full max-w-[200px]" />
            </div>
            <div className="col-start-3 row-start-1 self-end justify-self-end">
              <Node label="Organizations" className="w-full max-w-[220px]" />
            </div>

            <div className="relative col-span-3 row-start-2 flex min-h-[200px] items-center justify-center xl:min-h-[220px]">
              <div className="pointer-events-none absolute inset-2 rounded-2xl bg-ase-primary/[0.03] blur-3xl" />
              <HubLines />
              <div className="relative z-[2] w-full max-w-[300px] xl:max-w-[320px]">
                <CorePanel />
              </div>
            </div>

            <div className="col-start-1 row-start-3 self-start justify-self-start">
              <div className="w-full max-w-[220px] space-y-5">
                <Node label="RBAC" tone="accent" />
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">Activity</div>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ase-accent/70 shadow-[0_0_12px_rgba(34,211,238,0.2)]" />
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <FeedRow label="Token issued" meta="2m" />
                    <FeedRow label="Role linked" meta="9m" />
                    <FeedRow label="Plan synced" meta="1h" />
                  </div>
                </div>
              </div>
            </div>

            <div className="col-start-2 row-start-3 self-start justify-self-center">
              <Node label="Audit" className="w-full max-w-[200px]" />
            </div>

            <div className="col-start-3 row-start-3 self-start justify-self-end">
              <div className="w-full max-w-[220px] space-y-5">
                <Node label="Billing" />
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 backdrop-blur-sm">
                  <div className="text-xs font-semibold uppercase tracking-wide text-ase-muted">Status</div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <MiniStat label="Auth" ok />
                    <MiniStat label="RBAC" ok />
                    <MiniStat label="Billing" ok />
                    <MiniStat label="Audit" ok />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-ase-bg2/35 px-2 py-1.5 sm:rounded-xl sm:px-2.5 sm:py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted sm:text-xs">{label}</div>
      <div className="mt-0.5 text-sm font-extrabold tracking-tight text-ase-text">{value}</div>
    </div>
  )
}

function FeedRow({ label, meta }: { label: string; meta: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-ase-bg2/30 px-2.5 py-1.5 sm:rounded-xl sm:px-3 sm:py-2">
      <div className="text-xs font-medium text-ase-text2">{label}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{meta}</div>
    </div>
  )
}

function MiniStat({ label, ok }: { label: string; ok?: boolean }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-ase-bg2/30 px-2.5 py-1.5 sm:rounded-xl sm:px-3 sm:py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 flex items-center gap-1.5">
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2',
            ok ? 'bg-ase-success/80 shadow-[0_0_12px_rgba(34,197,94,0.12)]' : 'bg-ase-warning/80',
          )}
        />
        <span className="text-xs font-semibold text-ase-text2">{ok ? 'ok' : 'degraded'}</span>
      </div>
    </div>
  )
}
