import { useState, type ReactNode } from 'react'
import { Area, AreaChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
  leading,
}: {
  badge: string
  title: string
  subtitle: string
  contextChips?: ReactNode
  actions?: ReactNode
  sidePanel?: ReactNode
  /** Optional slot rendered above everything else (e.g. the account avatar + greeting),
   * so it's the first, most prominent thing in the header. */
  leading?: ReactNode
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber'
}) {
  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-ase-surface p-6 shadow-soft md:p-8">
      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
        <div>
          {leading ? <div className="mb-5">{leading}</div> : null}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Badge variant="info" className="mb-0">
              {badge}
            </Badge>
          </div>
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

/** KPI card with a "vs last month" delta badge — used for the headline
 * metrics an admin checks trend on daily (users, individual purchases, plan
 * signups). `changePct` null means there's no previous-month baseline (see
 * analytics._change_pct on the backend), rendered as a "new" badge instead
 * of a meaningless percentage. Comparison window is month-to-date vs the
 * same day-of-month range last month, not two full calendar months — see
 * `_mtd_comparison_range`. */
export function PremiumComparisonStat({
  label,
  icon,
  current,
  previous,
  changePct,
  newLabel,
  vsLabel,
}: {
  label: string
  icon: string
  current: number
  previous: number
  changePct: number | null
  newLabel: string
  vsLabel: string
}) {
  const isUp = changePct != null && changePct > 0
  const isDown = changePct != null && changePct < 0
  return (
    <Card className="relative overflow-hidden rounded-[1.75rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft" interactive>
      <div className="absolute inset-x-0 top-0 h-1 bg-ase-brand/80" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{label}</div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-ase-text">{current.toLocaleString()}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {changePct == null ? (
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 font-semibold text-ase-muted">
                {newLabel}
              </span>
            ) : (
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 font-semibold tabular-nums',
                  isUp && 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
                  isDown && 'border-rose-400/30 bg-rose-400/10 text-rose-300',
                  !isUp && !isDown && 'border-white/10 bg-white/[0.05] text-ase-muted',
                )}
              >
                {isUp ? '▲' : isDown ? '▼' : '—'} {Math.abs(changePct)}%
              </span>
            )}
            <span className="truncate text-ase-text2">
              {vsLabel} {previous.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-ase-bg2 text-sm text-ase-text">
          {icon}
        </div>
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

export type TrendSeriesData = {
  days: number[]
  current: (number | null)[]
  previous_month: (number | null)[]
  avg_6_months: (number | null)[]
}

/** "This month vs. last month" / "this month vs. the average of the last 6
 * months" — one chart, two lines, with a toggle for which comparison line
 * is shown. Both comparison series come from the same API response (see
 * TrendComparisonsRead on the backend), so flipping the toggle is a pure
 * client-side re-slice, no refetch. The x-axis is trimmed to the last day
 * either line actually has data for, so a short month (or "today" being
 * early in the month) doesn't leave a long empty tail. */
export function PremiumTrendCompareChart({
  title,
  data,
  unit = 'count',
  currentColor = '#22d3ee',
  currentLabel,
  previousMonthLabel,
  avg6MonthsLabel,
  toggle1mLabel,
  toggle6mLabel,
  valueFormatter,
  className,
}: {
  title: string
  data: TrendSeriesData
  unit?: 'count' | 'currency'
  currentColor?: string
  currentLabel: string
  previousMonthLabel: string
  avg6MonthsLabel: string
  toggle1mLabel: string
  toggle6mLabel: string
  valueFormatter?: (v: number) => string
  className?: string
}) {
  const [mode, setMode] = useState<'1m' | '6m'>('1m')

  const comparisonSeries = mode === '1m' ? data.previous_month : data.avg_6_months
  const comparisonLabel = mode === '1m' ? previousMonthLabel : avg6MonthsLabel
  const lastIdx = data.days.reduce(
    (last, _day, i) => (data.current[i] != null || comparisonSeries[i] != null ? i : last),
    -1,
  )
  const chartData = data.days.slice(0, lastIdx + 1).map((day, i) => ({
    day,
    current: data.current[i],
    comparison: comparisonSeries[i],
  }))

  const fmt = (v: number) =>
    valueFormatter ? valueFormatter(v) : unit === 'currency' ? v.toLocaleString(undefined, { style: 'currency', currency: 'EUR' }) : String(v)

  return (
    <Card className={cn('rounded-[2rem] border-white/[0.08] bg-ase-surface p-5 shadow-soft', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{title}</div>
        <div className="flex gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
          {(['1m', '6m'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition',
                mode === m ? 'bg-ase-brand/20 text-ase-brand' : 'text-ase-muted hover:text-ase-text',
              )}
            >
              {m === '1m' ? toggle1mLabel : toggle6mLabel}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-ase-text2">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: currentColor }} />
          {currentLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full border-t border-dashed border-ase-muted" />
          {comparisonLabel}
        </span>
      </div>
      <div className="mt-3 h-52">
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-ase-muted">—</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
                allowDecimals={unit === 'currency'}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{ background: '#0f1118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                labelFormatter={(day) => `${title} · ${day}`}
                formatter={(v, name) => {
                  const n = typeof v === 'number' ? v : Number(v ?? 0)
                  return [fmt(n), name === 'current' ? currentLabel : comparisonLabel]
                }}
              />
              {/* connectNulls: with sparse day-to-day data (a small platform
                  might only have one or two purchases a month) a lone
                  non-null point among 30 nulls draws nothing at all without
                  this — the line needs to bridge the gaps between the days
                  that actually happened to keep the trend visible. It still
                  correctly stops at the last real point rather than
                  drawing into days that haven't happened yet, since there's
                  no further data for it to connect to. */}
              <Line
                type="monotone"
                dataKey="current"
                stroke={currentColor}
                strokeWidth={2.5}
                dot={{ r: 3, fill: currentColor, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="comparison"
                stroke="#94a3b8"
                strokeWidth={1.75}
                strokeDasharray="4 3"
                dot={{ r: 2, fill: '#94a3b8', strokeWidth: 0 }}
                activeDot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
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
