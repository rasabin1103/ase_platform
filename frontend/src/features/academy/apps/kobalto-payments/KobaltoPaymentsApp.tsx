import { useState } from 'react'
import type { RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import { formatEur } from '../kobalto/transferLogic'
import {
  ACTION_LABEL,
  INITIAL_PAYMENTS,
  PLAN_LABEL,
  STATE_LABEL,
  act,
  createTestPayment,
  type PayAction,
  type PayState,
  type PaymentsState,
  type Plan,
  type SeedInput,
} from './paymentLogic'

const STATE_CLS: Record<PayState, string> = {
  pending: 'bg-slate-100 text-slate-700',
  authorized: 'bg-sky-100 text-sky-800',
  declined: 'bg-red-100 text-red-800',
  cancelled: 'bg-zinc-200 text-zinc-700',
  settled: 'bg-emerald-100 text-emerald-800',
  partially_refunded: 'bg-amber-100 text-amber-800',
  refunded: 'bg-violet-100 text-violet-800',
  disputed: 'bg-orange-100 text-orange-800',
}

const ACTIONS: PayAction[] = ['authorize', 'decline', 'settle', 'cancel', 'dispute', 'win', 'lose']
const SEED_STATES: PayState[] = ['pending', 'authorized', 'declined', 'cancelled', 'settled', 'partially_refunded', 'refunded', 'disputed']

/** Consola de operaciones de cobros con tarjeta en staging (KOB-170). */
export function KobaltoPaymentsApp({
  dispatch,
  state,
  initialForm,
}: ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }) {
  const app = (state.appState['kobalto-payments'] as PaymentsState | undefined) ?? INITIAL_PAYMENTS
  const build = { active: state.activeBugs, fixed: state.fixedBugs, regressions: state.activeRegressions }
  const pre = initialForm ?? {}
  const [seed, setSeed] = useState<SeedInput>(() => ({
    plan: (pre.plan as Plan) ?? 'standard',
    amount: pre.amount ?? '100',
    days: pre.days ?? '5',
    state: (pre.state as PayState) ?? 'settled',
  }))
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [refund, setRefund] = useState(pre.refund ?? '')
  const [refund2, setRefund2] = useState(pre.refund2 ?? '')
  const [suggested, setSuggested] = useState<PayAction | undefined>(pre.action as PayAction | undefined)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const selected = app.payments.find((p) => p.id === selectedId) ?? app.payments[0]

  const create = (e: React.FormEvent) => {
    e.preventDefault()
    const r = createTestPayment(app, seed)
    dispatch({ type: 'app', event: { ...r.event, state: r.state } })
    setResult({ ok: r.ok, message: r.message })
    if (r.id) setSelectedId(r.id)
  }

  const run = (action: PayAction) => {
    if (!selected) return
    const r = act(app, selected.id, action, action === 'refund' ? refund : '', build)
    dispatch({ type: 'app', event: { ...r.event, state: r.state } })
    setResult({ ok: r.ok, message: r.message })
    if (action === 'refund' && refund2) {
      setRefund(refund2)
      setRefund2('')
    } else if (action === suggested) {
      setSuggested(undefined)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none'
  const btn = (a: PayAction) =>
    `rounded-lg border px-3 py-1.5 text-sm font-medium ${
      suggested === a ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/40' : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
    }`

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>⚠ STAGING · https://ops.staging.kobalto.example/cobros</span>
        <span>build 4.0.0-rc{1 + state.build}</span>
      </div>
      <header className="flex items-center justify-between bg-slate-800 px-5 py-3 text-white">
        <span className="text-lg font-bold tracking-tight">
          kobalto <span className="font-normal text-slate-300">pay · operaciones</span>
        </span>
        <span className="text-sm text-slate-300">Usuario: qa.junior · rol Operaciones</span>
      </header>

      <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-[17rem_1fr]">
        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h3 className="mb-2 font-sans text-sm font-semibold text-slate-900">Cobros</h3>
            <ul className="max-h-[22rem] space-y-1.5 overflow-y-auto">
              {app.payments.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    aria-current={selected?.id === p.id}
                    className={`w-full rounded-lg border px-2.5 py-2 text-left text-xs ${
                      selected?.id === p.id ? 'border-teal-600 bg-teal-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-slate-800">{p.ref}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATE_CLS[p.state]}`}>{STATE_LABEL[p.state]}</span>
                    </span>
                    <span className="mt-0.5 block text-slate-500">
                      {p.merchant} · {formatEur(p.amount)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-dashed border-amber-400 bg-amber-50 p-4">
            <h3 className="font-sans text-sm font-semibold text-amber-900">Generador de datos de prueba</h3>
            <p className="mb-3 text-xs text-amber-800">Solo staging: crea un cobro directamente en el estado que necesites.</p>
            <form className="grid grid-cols-2 gap-2 text-xs" onSubmit={create}>
              <label className="col-span-2 block">
                <span className="mb-0.5 block text-slate-600">Estado inicial</span>
                <select className={inputCls} value={seed.state} onChange={(e) => setSeed((s) => ({ ...s, state: e.target.value as PayState }))}>
                  {SEED_STATES.map((s) => (
                    <option key={s} value={s}>
                      {STATE_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-0.5 block text-slate-600">Plan del comercio</span>
                <select className={inputCls} value={seed.plan} onChange={(e) => setSeed((s) => ({ ...s, plan: e.target.value as Plan }))}>
                  <option value="standard">Estándar</option>
                  <option value="pro">Pro</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-0.5 block text-slate-600">Importe (€)</span>
                <input className={inputCls} value={seed.amount} onChange={(e) => setSeed((s) => ({ ...s, amount: e.target.value }))} inputMode="decimal" />
              </label>
              <label className="col-span-2 block">
                <span className="mb-0.5 block text-slate-600">Antigüedad del cobro (días)</span>
                <input className={inputCls} value={seed.days} onChange={(e) => setSeed((s) => ({ ...s, days: e.target.value }))} inputMode="numeric" />
              </label>
              <button type="submit" className="col-span-2 rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700">
                Crear cobro de prueba
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          {result && (
            <div role="status" className={`mb-4 rounded-lg px-3 py-2 font-mono text-xs ${result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
              {result.ok ? '✓ ' : '✕ '}
              {result.message}
            </div>
          )}
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-sans text-lg font-semibold text-slate-900">
                    {selected.ref} · {selected.merchant}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Plan {PLAN_LABEL[selected.plan]} · cobrado hace {selected.daysAgo} días{selected.test ? ' · dato de prueba' : ''}
                  </p>
                </div>
                <span className={`rounded-md px-2.5 py-1 text-sm font-semibold ${STATE_CLS[selected.state]}`}>{STATE_LABEL[selected.state]}</span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                {[
                  ['Importe', formatEur(selected.amount)],
                  ['Devuelto', formatEur(selected.refunded)],
                  ['Pendiente', formatEur(Math.max(0, Math.round((selected.amount - selected.refunded) * 100) / 100))],
                  ['Comisiones', formatEur(selected.fees)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-slate-50 p-2.5">
                    <dt className="text-xs text-slate-500">{k}</dt>
                    <dd className="font-semibold text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>

              <h3 className="mb-2 mt-5 font-sans text-sm font-semibold text-slate-900">Acciones</h3>
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map((a) => (
                  <button key={a} type="button" className={btn(a)} onClick={() => run(a)}>
                    {ACTION_LABEL[a]}
                  </button>
                ))}
              </div>
              <form
                className="mt-3 flex flex-wrap items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  run('refund')
                }}
              >
                <label className="block text-sm">
                  <span className="mb-1 block text-xs text-slate-600">Importe a devolver (€)</span>
                  <input className={inputCls} value={refund} onChange={(e) => setRefund(e.target.value)} placeholder="Ej.: 25,00" inputMode="decimal" />
                </label>
                <button type="submit" className={btn('refund')}>
                  Devolver
                </button>
                {refund2 && <span className="text-xs text-slate-500">Después: devolver {refund2} €</span>}
              </form>

              <h3 className="mb-2 mt-5 font-sans text-sm font-semibold text-slate-900">Historial</h3>
              <ol className="space-y-1 border-l-2 border-slate-200 pl-3 text-xs text-slate-600">
                {selected.history.map((h, i) => (
                  <li key={i}>{h.label}</li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-sm text-slate-500">No hay cobros.</p>
          )}
        </section>
      </div>
    </div>
  )
}
