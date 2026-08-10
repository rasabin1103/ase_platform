import type { ReactNode } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card } from '../../ui/Card'
import { cn } from '../../ui/cn'

export function PremiumHero({
  badge,
  title,
  subtitle,
  contextChips,
  actions,
  sidePanel,
}: {
  badge: string
  title: string
  subtitle: string
  contextChips?: ReactNode
  actions?: ReactNode
  sidePanel?: ReactNode
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber'
}) {
  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-ase-surface p-6 shadow-soft md:p-8">
      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
        <div>
          <Badge variant="info" className="mb-5">
            {badge}
          </Badge>
          <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-ase-text md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ase-text2 md:text-base">{subtitle}</p>
          {contextChips ? <div className="mt-6 flex flex-wrap items-center gap-3">{contextChips}</div> : null}
          {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {sidePanel}
      </div>
    </section>
  )
}

export function PremiumMetricCard({
  label,
  hint,
  value,
  icon,
  format = 'number',
}: {
  label: string
  hint?: string
  value: number | string
  icon: string
  accent: string
  format?: 'number' | 'currency'
}) {
  const display =
    typeof value === 'string'
      ? value
      : format === 'currency'
        ? value.toLocaleString(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
        : value.toLocaleString()
  return (
    <Card className="relative overflow-hidden rounded-[1.75rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft" interactive>
      <div className="absolute inset-x-0 top-0 h-1 bg-ase-brand/80" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{label}</div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-ase-text">{display}</div>
          {hint ? <div className="mt-2 text-xs text-ase-text2">{hint}</div> : null}
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-ase-bg2 text-sm text-ase-text">{icon}</div>
      </div>
    </Card>
  )
}

export function PremiumOrb({ label, value, tone }: { label: string; value: number | string; tone: 'success' | 'info' | 'warning' | 'violet' }) {
  const toneClass = tone === 'success' ? 'border-emerald-300/20' : tone === 'warning' ? 'border-amber-300/20' : 'border-white/10'
  return (
    <div className={cn('rounded-3xl border bg-ase-bg2/60 p-4 text-center shadow-soft', toneClass)}>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide opacity-75">{label}</div>
    </div>
  )
}

export function PremiumInsightsCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ase-text">{title}</h2>
        {action}
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </Card>
  )
}

export function InsightBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ase-text2">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-ase-brand/80" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function PremiumChartCard({
  title,
  data,
  color = '#22d3ee',
  valueFormatter,
  className,
}: {
  title: string
  data: { month: string; value: number }[]
  color?: string
  valueFormatter?: (v: number) => string
  className?: string
}) {
  const chartData = data.map((d) => ({ ...d, label: d.month.slice(5) || d.month }))
  return (
    <Card className={cn('rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft', className)}>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{title}</div>
      <div className="mt-4 h-52">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-ase-muted">—</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={{ background: '#0f1118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                formatter={(v) => {
                  const n = typeof v === 'number' ? v : Number(v ?? 0)
                  return [valueFormatter ? valueFormatter(n) : n, '']
                }}
              />
              <Area type="monotone" dataKey="value" stroke={color} fill={`url(#grad-${title})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

const BREAKDOWN_PALETTE = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#f87171', '#94a3b8']

export function PremiumBreakdownCard({
  title,
  subtitle,
  items,
  emptyLabel,
  className,
}: {
  title: string
  subtitle?: string
  items: { label: string; value: number }[]
  emptyLabel: string
  className?: string
}) {
  const total = items.reduce((sum, i) => sum + i.value, 0)
  const sorted = [...items].sort((a, b) => b.value - a.value)
  return (
    <Card className={cn('rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft', className)}>
      <div className="text-sm font-semibold text-ase-text">{title}</div>
      {subtitle ? <div className="mt-1 text-xs text-ase-text2">{subtitle}</div> : null}
      <div className="mt-5 space-y-3">
        {total === 0 ? (
          <div className="py-6 text-center text-sm text-ase-muted">{emptyLabel}</div>
        ) : (
          sorted.map((item, idx) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
            const color = BREAKDOWN_PALETTE[idx % BREAKDOWN_PALETTE.length]
            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-ase-text2">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    {item.label}
                  </span>
                  <span className="tabular-nums">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}

export function PremiumSplitStat({
  title,
  subtitle,
  totalLabel,
  total,
  positiveLabel,
  positive,
  negativeLabel,
  negative,
  tags,
  tagsLabel,
  emptyLabel,
  className,
}: {
  title: string
  subtitle?: string
  totalLabel: string
  total: number
  positiveLabel: string
  positive: number
  negativeLabel: string
  negative: number
  tags: { tag: string; count: number; label: string }[]
  tagsLabel: string
  emptyLabel: string
  className?: string
}) {
  const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0
  return (
    <Card className={cn('rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft', className)}>
      <div className="text-sm font-semibold text-ase-text">{title}</div>
      {subtitle ? <div className="mt-1 text-xs text-ase-text2">{subtitle}</div> : null}
      {total === 0 ? (
        <div className="py-6 text-center text-sm text-ase-muted">{emptyLabel}</div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <PremiumOrb label={totalLabel} value={total} tone="info" />
            <PremiumOrb label={positiveLabel} value={positive} tone="success" />
            <PremiumOrb label={negativeLabel} value={negative} tone="warning" />
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="flex h-full w-full">
              <div className="h-full bg-emerald-400/80" style={{ width: `${positivePct}%` }} />
              <div className="h-full flex-1 bg-amber-400/70" />
            </div>
          </div>
          {tags.length > 0 ? (
            <div className="mt-5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ase-muted">{tagsLabel}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t.tag}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-ase-text2"
                  >
                    {t.label} · {t.count}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </Card>
  )
}

export function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ase-muted">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-ase-text">{value}</div>
    </div>
  )
}

export function PremiumActionButton(props: React.ComponentProps<typeof Button>) {
  return <Button size="sm" {...props} />
}
