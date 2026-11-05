import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getFlDashboard, getFlGoal } from '../../api/freelance.api'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import { Kpi, Panel } from './kit'
import { MonthlyChart } from './MonthlyChart'
import { ErrorNote, Field } from './shared'
import { num, useFt } from './useFt'

export function DashboardTab() {
  const { ft, eur, locale } = useFt()
  const [year, setYear] = useState(new Date().getFullYear())
  const [concept, setConcept] = useState('')
  const [goal, setGoal] = useState({ net: 2000, cost: 300, days: 18, hours: 0 })
  const q = useQuery({ queryKey: ['fl-dashboard', year, concept], queryFn: () => getFlDashboard(year, concept) })
  const g = useQuery({ queryKey: ['fl-goal', year, goal], queryFn: () => getFlGoal({ year, ...goal }) })
  const bestMonth = (months: Array<{ m: number; net: number }>) => {
    const best = [...months].sort((a, b) => b.net - a.net)[0]
    return best && best.net > 0 ? `${monthName(best.m)} · ${eur(best.net)}` : '—'
  }
  const monthName = (m: number) => new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2000, m - 1, 1))

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={ft('common.year')}><Input type="number" min={2000} max={2100} value={year} onChange={(e) => setYear(num(e.target.value))} /></Field>
        <Field label={ft('dashboard.concept')}><Input value={concept} maxLength={100} onChange={(e) => setConcept(e.target.value)} /></Field>
      </div>
      {q.isLoading ? <Skeleton className="h-48 rounded-2xl" /> : null}
      {q.isError ? <ErrorNote error={q.error} /> : null}
      {q.data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label={ft('dashboard.income')} value={eur(q.data.months.reduce((s, m) => s + m.income, 0))} hint={ft('dashboard.totals')} />
            <Kpi label={ft('dashboard.expenses')} value={eur(q.data.months.reduce((s, m) => s + m.netExpenses, 0))} hint={ft('dashboard.totals')} />
            <Kpi tone="good" label={ft('dashboard.net')} value={eur(q.data.months.reduce((s, m) => s + m.net, 0))} hint={ft('dashboard.totals')} />
            <Kpi label={ft('dashboard.bestMonth')} value={bestMonth(q.data.months)} />
          </div>
          <Panel title={ft('dashboard.chartTitle')} subtitle={String(year)}>
            <MonthlyChart months={q.data.months} />
          </Panel>
          <div className="overflow-x-auto rounded-xl border border-ase-border bg-ase-surface">
            <table className="min-w-full text-left text-sm text-ase-text2">
              <thead className="text-xs uppercase text-ase-muted">
                <tr>
                  <th className="p-3">{ft('common.month')}</th>
                  {['income', 'expenses', 'vatNet', 'irpf', 'reserve', 'net', 'days', 'hours', 'available'].map((k) => (
                    <th key={k} className="p-3 text-right">{ft(`dashboard.${k}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {q.data.months.map((m) => (
                  <tr key={m.key} className="border-t border-ase-border">
                    <td className="p-3 capitalize">{monthName(m.m)}</td>
                    <td className="p-3 text-right">{eur(m.income)}</td>
                    <td className="p-3 text-right">{eur(m.netExpenses)}</td>
                    <td className="p-3 text-right">{eur(m.vatNet)}</td>
                    <td className="p-3 text-right">{eur(m.irpf)}</td>
                    <td className="p-3 text-right">{eur(m.reserve)}</td>
                    <td className="p-3 text-right font-medium text-ase-text">{eur(m.net)}</td>
                    <td className="p-3 text-right">{m.days}</td>
                    <td className="p-3 text-right">{m.hours}</td>
                    <td className="p-3 text-right">{m.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section aria-labelledby="fl-prof">
            <h2 id="fl-prof" className="mb-2 text-sm font-semibold text-ase-text">{ft('dashboard.profitability')}</h2>
            <div className="overflow-x-auto rounded-xl border border-ase-border bg-ase-surface">
              <table className="min-w-full text-left text-sm text-ase-text2">
                <thead className="text-xs uppercase text-ase-muted">
                  <tr>
                    <th className="p-3">{ft('invoices.client')}</th>
                    {['income', 'avgDay', 'avgHour', 'expenseShare', 'net', 'avgDelay'].map((k) => (
                      <th key={k} className="p-3 text-right">{ft(`dashboard.${k}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {q.data.profitability.map((p) => (
                    <tr key={p.clientId} className="border-t border-ase-border">
                      <td className="p-3">{p.name}</td>
                      <td className="p-3 text-right">{eur(p.baseCents)}</td>
                      <td className="p-3 text-right">{eur(p.avgDayCents)}</td>
                      <td className="p-3 text-right">{eur(p.avgHourCents)}</td>
                      <td className="p-3 text-right">{eur(p.expenseShareCents)}</td>
                      <td className="p-3 text-right font-medium text-ase-text">{eur(p.netCents)}</td>
                      <td className="p-3 text-right">{p.avgDelayDays ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
      <section aria-labelledby="fl-goal" className="rounded-xl border border-ase-border bg-ase-surface p-4">
        <h2 id="fl-goal" className="mb-3 text-sm font-semibold text-ase-text">{ft('dashboard.goal')}</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {(['net', 'cost', 'days', 'hours'] as const).map((k) => (
            <Field key={k} label={ft(`dashboard.goal${k[0].toUpperCase()}${k.slice(1)}`)}>
              <Input type="number" min={0} value={goal[k]} onChange={(e) => setGoal({ ...goal, [k]: num(e.target.value) })} />
            </Field>
          ))}
        </div>
        {g.data?.result ? (
          <dl className="mt-3 grid gap-2 text-sm text-ase-text2 sm:grid-cols-3">
            <div><dt className="text-ase-muted">{ft('dashboard.goalResult')}</dt><dd className="text-lg font-semibold text-ase-text">{eur(Math.round(g.data.result.base * 100))}</dd></div>
            <div><dt className="text-ase-muted">{ft('dashboard.goalDay')}</dt><dd>{g.data.result.day == null ? '—' : eur(Math.round(g.data.result.day * 100))}</dd></div>
            <div><dt className="text-ase-muted">{ft('dashboard.goalHour')}</dt><dd>{g.data.result.hour == null ? '—' : eur(Math.round(g.data.result.hour * 100))}</dd></div>
          </dl>
        ) : null}
        <p className="mt-2 text-xs text-ase-muted">{ft('dashboard.goalAlt')}</p>
      </section>
    </div>
  )
}
