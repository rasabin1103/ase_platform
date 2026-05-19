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
  accent = 'cyan',
}: {
  badge: string
  title: string
  subtitle: string
  contextChips?: ReactNode
  actions?: ReactNode
  sidePanel?: ReactNode
  accent?: 'cyan' | 'violet' | 'emerald' | 'amber'
}) {
  const glow =
    accent === 'violet'
      ? 'rgba(168,85,247,0.18)'
      : accent === 'emerald'
        ? 'rgba(52,211,153,0.16)'
        : accent === 'amber'
          ? 'rgba(251,191,36,0.16)'
          : 'rgba(34,211,238,0.18)'
  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-[radial-gradient(circle_at_15%_0%,var(--glow),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.075),rgba(255,255,255,0.02))] p-6 shadow-[0_34px_120px_rgba(0,0,0,0.46)] md:p-8" style={{ ['--glow' as string]: glow }}>
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:38px_38px]" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-center">
        <div>
          <Badge variant="info" className="mb-5 border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
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
  accent,
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
    <Card className="relative overflow-hidden rounded-[1.75rem] border-white/[0.08] bg-ase-surface/60 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur" interactive>
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', accent)} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ase-muted">{label}</div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-ase-text">{display}</div>
          {hint ? <div className="mt-2 text-xs text-ase-text2">{hint}</div> : null}
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm">{icon}</div>
      </div>
    </Card>
  )
}

export function PremiumOrb({ label, value, tone }: { label: string; value: number | string; tone: 'success' | 'info' | 'warning' | 'violet' }) {
  const toneClass =
    tone === 'success'
      ? 'from-emerald-300/20 to-teal-400/10 text-emerald-100'
      : tone === 'warning'
        ? 'from-amber-300/20 to-orange-400/10 text-amber-100'
        : tone === 'violet'
          ? 'from-violet-300/20 to-fuchsia-400/10 text-violet-100'
          : 'from-cyan-300/20 to-violet-400/10 text-cyan-100'
  return (
    <div className={cn('rounded-3xl border border-white/10 bg-gradient-to-br p-4 text-center shadow-[0_18px_60px_rgba(0,0,0,0.28)]', toneClass)}>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide opacity-75">{label}</div>
    </div>
  )
}

export function PremiumInsightsCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur">
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
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400" style={{ width: `${pct}%` }} />
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
    <Card className={cn('rounded-[2rem] border-white/[0.08] bg-ase-surface/60 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur', className)}>
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
