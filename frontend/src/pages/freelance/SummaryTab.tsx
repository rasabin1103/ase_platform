import { useQuery } from '@tanstack/react-query'
import { ArrowDownRight, ArrowUpRight, Banknote, FilePlus2, Hourglass, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getFlDashboard, getFlSummary } from '../../api/freelance.api'
import { Skeleton } from '../../components/ui/Skeleton'
import { cn } from '../../components/ui/cn'
import { Kpi, Panel, Pill, SplitBar } from './kit'
import { MonthlyChart } from './MonthlyChart'
import { ErrorNote } from './shared'
import { useFt } from './useFt'

export function SummaryTab() {
  const { ft, eur } = useFt()
  const year = new Date().getFullYear()
  const q = useQuery({ queryKey: ['fl-summary'], queryFn: getFlSummary })
  const dash = useQuery({ queryKey: ['fl-dashboard', year, ''], queryFn: () => getFlDashboard(year, '') })

  if (q.isLoading) return <Skeleton className="h-64 rounded-2xl" />
  if (q.isError || !q.data) return <ErrorNote error={q.error} />
  const { cash, forecast, notices, receivable, payable } = q.data
  const months = dash.data?.months ?? []
  const sum = (k: 'income' | 'netExpenses' | 'net') => months.reduce((s, m) => s + m[k], 0)
  const healthy = cash.available >= 0
  const top = [...(dash.data?.profitability ?? [])].sort((a, b) => b.baseCents - a.baseCents).slice(0, 3)
  const topTotal = top.reduce((s, c) => s + c.baseCents, 0) || 1

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-ase-border bg-gradient-to-br from-emerald-500/10 via-ase-surface to-ase-surface p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-ase-muted">
              <Wallet className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {ft('summary.cash')}
            </div>
            <div className={cn('mt-2 text-4xl font-semibold tabular-nums md:text-5xl', healthy ? 'text-ase-text' : 'text-rose-300')}>
              {eur(cash.available)}
            </div>
            <p className="mt-2 max-w-md text-sm text-ase-muted">{ft('summary.cashHint')}</p>
            <div className="mt-3">
              <Pill tone={healthy ? 'good' : 'bad'}>{healthy ? ft('summary.healthGood') : ft('summary.healthLow')}</Pill>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" aria-label={ft('summary.quick')}>
            <Link to="/freelance/invoices" className="inline-flex items-center gap-2 rounded-lg border border-ase-border bg-ase-surface px-3 py-2 text-sm text-ase-text hover:border-emerald-400/40">
              <FilePlus2 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {ft('invoices.new')}
            </Link>
            <Link to="/freelance/expenses" className="inline-flex items-center gap-2 rounded-lg border border-ase-border bg-ase-surface px-3 py-2 text-sm text-ase-text hover:border-emerald-400/40">
              <Receipt className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {ft('expenses.new')}
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi icon={TrendingUp} label={ft('summary.ytdInvoiced')} value={eur(sum('income'))} hint={`${ft('summary.ytd')} ${year}`} />
        <Kpi icon={Receipt} label={ft('summary.ytdExpenses')} value={eur(sum('netExpenses'))} hint={`${ft('summary.ytd')} ${year}`} />
        <Kpi icon={Banknote} label={ft('summary.ytdNet')} value={eur(sum('net'))} tone={sum('net') >= 0 ? 'good' : 'bad'} hint={`${ft('summary.ytd')} ${year}`} />
        <Kpi icon={ArrowDownRight} label={ft('summary.receivable')} value={eur(receivable.cents)} tone={notices.late.length ? 'warn' : 'neutral'} hint={ft('summary.invoicesCount', { n: receivable.count })} />
        <Kpi icon={ArrowUpRight} label={ft('summary.payable')} value={eur(payable.cents)} hint={ft('summary.invoicesCount', { n: payable.count })} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3" title={ft('summary.chartTitle')} subtitle={String(year)}>
          {dash.isLoading ? <Skeleton className="h-72 rounded-xl" /> : <MonthlyChart months={months} />}
        </Panel>
        <Panel className="lg:col-span-2" title={ft('summary.where')} subtitle={ft('summary.whereHint')}>
          <SplitBar
            parts={[
              { label: ft('summary.yours'), value: cash.available, color: '#34d399', display: eur(cash.available) },
              { label: ft('summary.vat'), value: cash.vat, color: '#f59e0b', display: eur(cash.vat) },
              { label: ft('summary.reserve'), value: cash.reserve, color: '#a78bfa', display: eur(cash.reserve) },
              { label: ft('summary.allocated'), value: cash.allocated, color: '#38bdf8', display: eur(cash.allocated) },
            ]}
          />
        </Panel>
      </div>

      <Panel title={ft('summary.forecast')}>
        <div className="grid gap-3 md:grid-cols-3">
          {forecast.map((f) => {
            const balance = f.income - f.expenses - f.allocation
            return (
              <div key={f.days} className="rounded-xl border border-ase-border bg-white/[0.02] p-4 text-sm">
                <div className="mb-2 flex items-center justify-between font-medium text-ase-text">
                  <span>{ft('summary.horizon', { days: f.days })}</span>
                  <Pill tone={balance >= 0 ? 'good' : 'bad'}>{eur(balance)}</Pill>
                </div>
                <dl className="space-y-1 text-ase-text2">
                  <div className="flex justify-between"><dt>{ft('summary.income')}</dt><dd className="tabular-nums">{eur(f.income)}</dd></div>
                  <div className="flex justify-between"><dt>{ft('summary.expensesOut')}</dt><dd className="tabular-nums">{eur(f.expenses)}</dd></div>
                  <div className="flex justify-between"><dt>{ft('summary.allocation')}</dt><dd className="tabular-nums">{eur(f.allocation)}</dd></div>
                </dl>
              </div>
            )
          })}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={ft('summary.late')} action={<Pill tone={notices.late.length ? 'bad' : 'good'}>{eur(notices.lateTotalCents)}</Pill>}>
          <NoticeList rows={notices.late} empty={ft('summary.noNotices')} />
          <div className="mt-4 mb-2 flex items-center justify-between text-sm font-medium text-ase-text">
            <span className="flex items-center gap-2"><Hourglass className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />{ft('summary.upcoming')}</span>
            <span className="tabular-nums">{eur(notices.upcomingTotalCents)}</span>
          </div>
          <NoticeList rows={notices.upcoming} empty={ft('summary.noNotices')} />
        </Panel>
        <Panel title={ft('summary.topClients')}>
          {top.length === 0 ? (
            <p className="text-sm text-ase-muted">{ft('common.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {top.map((c) => (
                <li key={c.clientId} className="text-sm">
                  <div className="mb-1 flex justify-between text-ase-text2">
                    <span className="truncate">{c.name}</span>
                    <span className="tabular-nums text-ase-text">{eur(c.baseCents)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: `${(c.baseCents / topTotal) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}

function NoticeList({ rows, empty }: { rows: Array<{ id: number; number: string; client: string; due: string | null; totalCents: number }>; empty: string }) {
  const { eur } = useFt()
  if (rows.length === 0) return <p className="text-sm text-ase-muted">{empty}</p>
  return (
    <ul className="space-y-1.5 text-sm text-ase-text2">
      {rows.map((r) => (
        <li key={r.id} className="flex justify-between gap-2">
          <span className="truncate">{r.number} · {r.client} · {r.due}</span>
          <span className="tabular-nums">{eur(r.totalCents)}</span>
        </li>
      ))}
    </ul>
  )
}
