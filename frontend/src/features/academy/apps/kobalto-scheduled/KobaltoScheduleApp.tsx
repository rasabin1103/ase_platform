import { useState } from 'react'
import type { RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import { formatEur } from '../kobalto/transferLogic'
import {
  INITIAL_SCHEDULE,
  SIM_TODAY,
  cancel,
  cancelAsksScope,
  executions,
  formatDateEs,
  schedule,
  type Frequency,
  type ScheduleForm,
  type ScheduleState,
} from './scheduleLogic'

const EMPTY: ScheduleForm = { iban: '', beneficiary: '', amount: '', date: '', frequency: 'once', endDate: '' }
const FREQ: Record<Frequency, string> = { once: 'Una vez', weekly: 'Semanal', monthly: 'Mensual' }

/** Prototipo en staging de «Transferencias programadas» (KOB-151). */
export function KobaltoScheduleApp({
  dispatch,
  state,
  initialForm,
}: ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Partial<ScheduleForm> | Record<string, string> }) {
  const app = (state.appState['kobalto-scheduled'] as ScheduleState | undefined) ?? INITIAL_SCHEDULE
  const build = { active: state.activeBugs, fixed: state.fixedBugs }
  const [form, setForm] = useState<ScheduleForm>(() => ({ ...EMPTY, ...(initialForm as Partial<ScheduleForm>) }))
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [asking, setAsking] = useState<number | null>(null)

  const set = (k: keyof ScheduleForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const preview = executions(
    { date: form.date, frequency: form.frequency, endDate: form.frequency === 'once' ? '' : form.endDate },
    build.active.includes('M1-B2') && !build.fixed.includes('M1-B2'),
  )

  const confirm = () => {
    const r = schedule(app, form, build)
    dispatch({ type: 'app', event: { ...r.event, state: r.state } })
    setResult({ ok: r.ok, message: r.ok ? 'Transferencia programada' : r.message })
    setStep('form')
    if (r.ok) setForm(EMPTY)
  }
  const doCancel = (id: number, mode: 'next' | 'series') => {
    const r = cancel(app, id, mode, build)
    dispatch({ type: 'app', event: { ...r.event, state: r.state } })
    setAsking(null)
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none'

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>⚠ STAGING · https://staging.kobalto.example/programadas · prototipo KOB-151</span>
        <span>build 2.15.0-proto{1 + state.build}</span>
      </div>
      <header className="flex items-center justify-between bg-teal-700 px-5 py-3 text-white">
        <span className="text-lg font-bold tracking-tight">kobalto</span>
        <span className="text-sm">Cuenta QA-01 · hoy {formatDateEs(SIM_TODAY)}</span>
      </header>
      <div className="mx-auto grid max-w-5xl gap-5 p-5 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-sans text-lg font-semibold text-slate-900">Programar transferencia</h2>
          <p className="mb-4 text-sm text-slate-500">Elige cuándo se envía y si se repite.</p>
          {result && (
            <div role="status" className={`mb-4 rounded-lg px-3 py-2 text-sm ${result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
              {result.ok ? '✓ ' : '✕ '}
              {result.message}
            </div>
          )}
          {step === 'form' ? (
            <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                setResult(null)
                setStep('confirm')
              }}
            >
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-slate-600">IBAN del destinatario</span>
                <input className={inputCls} value={form.iban} onChange={set('iban')} placeholder="ES00 0000 0000 0000 0000 0000" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Beneficiario</span>
                <input className={inputCls} value={form.beneficiary} onChange={set('beneficiary')} placeholder="Nombre y apellidos" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Importe (€)</span>
                <input className={inputCls} value={form.amount} onChange={set('amount')} placeholder="0,00" inputMode="decimal" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Fecha de ejecución</span>
                <input className={inputCls} type="date" value={form.date} onChange={set('date')} aria-label="Fecha de ejecución" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-slate-600">Frecuencia</span>
                <select className={inputCls} value={form.frequency} onChange={set('frequency')} aria-label="Frecuencia">
                  {(Object.keys(FREQ) as Frequency[]).map((f) => (
                    <option key={f} value={f}>
                      {FREQ[f]}
                    </option>
                  ))}
                </select>
              </label>
              {form.frequency !== 'once' && (
                <label className="block text-sm">
                  <span className="mb-1 block text-slate-600">Fecha de fin (opcional)</span>
                  <input className={inputCls} type="date" value={form.endDate} onChange={set('endDate')} aria-label="Fecha de fin" />
                </label>
              )}
              <button type="submit" className="rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 sm:col-span-2">
                Continuar
              </button>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              <dl className="grid grid-cols-[8rem_1fr] gap-y-1 rounded-lg bg-slate-50 p-3">
                <dt className="text-slate-500">Destino</dt>
                <dd className="font-mono">{form.iban || '—'}</dd>
                <dt className="text-slate-500">Beneficiario</dt>
                <dd>{form.beneficiary || '—'}</dd>
                <dt className="text-slate-500">Importe</dt>
                <dd>{form.amount || '—'} €</dd>
                <dt className="text-slate-500">Frecuencia</dt>
                <dd>
                  {FREQ[form.frequency]}
                  {form.frequency !== 'once' && form.endDate ? ` hasta ${form.endDate}` : ''}
                </dd>
                <dt className="text-slate-500">Próximas</dt>
                <dd>{preview.length ? preview.map(formatDateEs).join(' · ') : '—'}</dd>
              </dl>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep('form')} className="flex-1 rounded-lg border border-slate-300 py-2.5 font-semibold text-slate-700 hover:bg-slate-50">
                  Modificar
                </button>
                <button type="button" onClick={confirm} className="flex-1 rounded-lg bg-teal-700 py-2.5 font-semibold text-white hover:bg-teal-800">
                  Programar
                </button>
              </div>
            </div>
          )}
        </section>
        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-sans text-sm font-semibold text-slate-900">Transferencias programadas</h3>
          {app.scheduled.length === 0 && <p className="text-sm text-slate-500">Todavía no tienes ninguna.</p>}
          <ul className="space-y-3">
            {app.scheduled.map((s) => (
              <li key={s.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{s.beneficiary}</span>
                  <span>{formatEur(s.amount)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  {FREQ[s.frequency]} · próximas: {s.executions.length ? s.executions.map(formatDateEs).join(', ') : 'ninguna'}
                </p>
                {asking === s.id ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => doCancel(s.id, 'next')} className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                      Solo la próxima
                    </button>
                    <button type="button" onClick={() => doCancel(s.id, 'series')} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50">
                      Toda la serie
                    </button>
                    <button type="button" onClick={() => setAsking(null)} className="px-2 py-1 text-xs text-slate-500">
                      No cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => (s.frequency !== 'once' && cancelAsksScope(build) ? setAsking(s.id) : doCancel(s.id, 'series'))}
                    className="mt-2 text-xs font-medium text-red-700 hover:underline"
                  >
                    Cancelar
                  </button>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
