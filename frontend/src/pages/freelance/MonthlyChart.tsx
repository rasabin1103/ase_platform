import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { FlMonth } from '../../api/freelance.api'
import { useFt } from './useFt'

/** Ingresos (base facturada) y gastos por mes, con el resultado neto en línea. Importes en euros. */
export function MonthlyChart({ months }: { months: FlMonth[] }) {
  const { ft, eur, locale } = useFt()
  const data = months.map((m) => ({
    name: new Intl.DateTimeFormat(locale, { month: 'short' }).format(new Date(2000, m.m - 1, 1)),
    income: m.income / 100,
    expenses: m.netExpenses / 100,
    net: m.net / 100,
  }))
  const fmt = (v: unknown) => eur(Math.round(Number(v) * 100))
  return (
    <div className="h-72 w-full" role="img" aria-label={ft('dashboard.chartLabel')}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
          <Tooltip
            formatter={(v) => fmt(v)}
            contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.25)', borderRadius: 12, fontSize: 12 }}
            cursor={{ fill: 'rgba(148,163,184,0.08)' }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="income" name={ft('dashboard.income')} fill="#34d399" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name={ft('dashboard.expenses')} fill="#64748b" radius={[4, 4, 0, 0]} />
          <Line dataKey="net" name={ft('dashboard.net')} stroke="#38bdf8" strokeWidth={2} dot={false} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
