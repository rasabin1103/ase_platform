import { useState } from 'react'
import type { RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import { formatEur } from '../kobalto/transferLogic'
import { simulate, type LoanForm, type LoanQuote } from './loanLogic'

const EMPTY: LoanForm = { age: '', income: '', amount: '', term: '' }

interface LoanHistory {
  items: { id: number; form: LoanForm; quote?: LoanQuote; error?: string }[]
  nextId: number
}
const INITIAL: LoanHistory = { items: [], nextId: 1 }

/** Simulador de préstamos personales en staging (KOB-163). */
export function KobaltoLoanApp({
  dispatch,
  state,
  initialForm,
}: ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }) {
  const history = (state.appState['kobalto-loans'] as LoanHistory | undefined) ?? INITIAL
  const [form, setForm] = useState<LoanForm>(() => ({ ...EMPTY, ...(initialForm as Partial<LoanForm>) }))
  const last = history.items[0]
  const set = (k: keyof LoanForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const run = () => {
    const r = simulate(form, { active: state.activeBugs, fixed: state.fixedBugs, regressions: state.activeRegressions })
    const next: LoanHistory = {
      items: [{ id: history.nextId, form, quote: r.quote, error: r.error }, ...history.items].slice(0, 12),
      nextId: history.nextId + 1,
    }
    dispatch({ type: 'app', event: { ...r.event, state: next } })
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none'

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>⚠ STAGING · https://staging.kobalto.example/prestamos/simulador</span>
        <span>build 3.2.0-rc{1 + state.build}</span>
      </div>
      <header className="flex items-center justify-between bg-teal-700 px-5 py-3 text-white">
        <span className="text-lg font-bold tracking-tight">kobalto</span>
        <span className="text-sm">Préstamo personal</span>
      </header>
      <div className="mx-auto grid max-w-5xl gap-5 p-5 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <div>
            <h2 className="font-sans text-lg font-semibold text-slate-900">Simula tu préstamo</h2>
            <p className="text-sm text-slate-500">Sin compromiso. Respuesta al momento.</p>
          </div>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              run()
            }}
          >
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Edad</span>
              <input className={inputCls} value={form.age} onChange={set('age')} placeholder="Ej.: 35" inputMode="numeric" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Ingresos netos al mes (€)</span>
              <input className={inputCls} value={form.income} onChange={set('income')} placeholder="Ej.: 2.000" inputMode="decimal" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Importe (€)</span>
              <input className={inputCls} value={form.amount} onChange={set('amount')} placeholder="1.000 – 30.000" inputMode="numeric" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Plazo (meses)</span>
              <input className={inputCls} value={form.term} onChange={set('term')} placeholder="12 – 84" inputMode="numeric" />
            </label>
            <button type="submit" className="rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 sm:col-span-2">
              Simular
            </button>
          </form>

          {last && (
            <div role="status" className={`rounded-xl border p-4 text-sm ${last.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-slate-50'}`}>
              {last.error ? (
                <p>✕ {last.error}</p>
              ) : last.quote ? (
                <>
                  <p className={`mb-2 font-semibold ${last.quote.approved ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {last.quote.approved ? '✓ Preaprobado' : last.quote.reason}
                  </p>
                  <dl className="grid grid-cols-2 gap-y-1">
                    <dt className="text-slate-500">Cuota mensual</dt>
                    <dd className="text-right text-lg font-bold">{formatEur(last.quote.installment)}</dd>
                    <dt className="text-slate-500">TIN</dt>
                    <dd className="text-right">{last.quote.rate.toFixed(2).replace('.', ',')} %</dd>
                    <dt className="text-slate-500">Total a devolver</dt>
                    <dd className="text-right">{formatEur(last.quote.total)}</dd>
                    <dt className="text-slate-500">Intereses</dt>
                    <dd className="text-right">{formatEur(last.quote.interest)}</dd>
                  </dl>
                </>
              ) : null}
            </div>
          )}
        </section>
        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-sans text-sm font-semibold text-slate-900">Tus simulaciones</h3>
          {history.items.length === 0 && <p className="text-sm text-slate-500">Aún no has simulado nada.</p>}
          <ul className="space-y-2 text-xs">
            {history.items.map((h) => (
              <li key={h.id} className="rounded-lg border border-slate-200 p-2">
                <p className="text-slate-500">
                  {h.form.age} años · {h.form.income} €/mes · {h.form.amount} € · {h.form.term} m
                </p>
                <p className={h.error ? 'text-red-700' : h.quote?.approved ? 'text-emerald-700' : 'text-amber-700'}>
                  {h.error ?? (h.quote ? `${formatEur(h.quote.installment)}/mes · ${h.quote.approved ? 'preaprobado' : 'no preaprobado'}` : '')}
                </p>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
