import { useEffect, useRef, useState } from 'react'
import type { ToolProps } from '../../tools/types'
import type { RunState } from '../../engine/types'
import { INITIAL_BANK, formatEur, submitTransfer, type BankState, type Transfer, type TransferForm } from './transferLogic'

const PROCESSING_MS = 900
const EMPTY: TransferForm = { iban: '', beneficiary: '', amount: '', concept: '' }

/** App bajo prueba: banca web de Kobalto en el entorno de staging. */
export function KobaltoTransferApp({
  dispatch,
  stateRef,
  state,
  initialForm,
}: ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Partial<TransferForm> }) {
  const bank = (state.appState.kobalto as BankState | undefined) ?? INITIAL_BANK
  const [form, setForm] = useState<TransferForm>(() => ({ ...EMPTY, ...initialForm }))
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const [pending, setPending] = useState(0)
  const [result, setResult] = useState<{ ok: boolean; message: string; transfer?: Transfer } | null>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const set = (k: keyof TransferForm) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const confirm = () => {
    // El botón NO se deshabilita mientras procesa (comportamiento de staging).
    const concurrent = pending > 0
    const snapshot = form
    setPending((p) => p + 1)
    const t = window.setTimeout(() => {
      const run = stateRef.current
      const current = (run?.appState.kobalto as BankState | undefined) ?? INITIAL_BANK
      const r = submitTransfer(current, snapshot, {
        concurrent,
        active: run?.activeBugs,
        fixed: run?.fixedBugs,
        regressions: run?.activeRegressions,
      })
      dispatch({ type: 'app', event: { ...r.event, state: r.bank } })
      setPending((p) => p - 1)
      setResult({ ok: r.ok, message: r.message, transfer: r.transfer })
      if (!concurrent) setStep('form')
      if (r.ok && !concurrent) setForm(EMPTY)
    }, PROCESSING_MS)
    timers.current.push(t)
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none'

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>⚠ STAGING · https://staging.kobalto.example/transferencias</span>
        <span>build 2.14.0-rc{3 + state.build}</span>
      </div>
      <header className="flex items-center justify-between bg-teal-700 px-5 py-3 text-white">
        <span className="text-lg font-bold tracking-tight">kobalto</span>
        <span className="text-sm">Cuenta QA-01</span>
      </header>
      <div className="mx-auto grid max-w-5xl gap-5 p-5 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-1 font-sans text-lg font-semibold text-slate-900">Nueva transferencia</h2>
          <p className="mb-4 text-sm text-slate-500">Envía dinero a cualquier cuenta española.</p>

          {result && (
            <div
              role="status"
              className={`mb-4 rounded-lg px-3 py-2 text-sm ${result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}
            >
              {result.ok && result.transfer ? (
                <>
                  ✓ Transferencia enviada · Justificante TRF-{String(result.transfer.id).padStart(5, '0')} ·{' '}
                  {formatEur(result.transfer.amount)} a {result.transfer.beneficiary}
                </>
              ) : (
                <>✕ {result.message}</>
              )}
            </div>
          )}

          {step === 'form' ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                setResult(null)
                setStep('confirm')
              }}
            >
              <label className="block text-sm">
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
                <span className="mb-1 block text-slate-600">Concepto (opcional)</span>
                <input className={inputCls} value={form.concept} onChange={set('concept')} placeholder="Ej.: cena del viernes" />
              </label>
              <button type="submit" className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white hover:bg-teal-800">
                Continuar
              </button>
            </form>
          ) : (
            <div className="space-y-3 text-sm">
              <p className="text-slate-600">Revisa los datos antes de confirmar:</p>
              <dl className="grid grid-cols-[8rem_1fr] gap-y-1 rounded-lg bg-slate-50 p-3">
                <dt className="text-slate-500">IBAN</dt>
                <dd className="font-mono">{form.iban || '—'}</dd>
                <dt className="text-slate-500">Beneficiario</dt>
                <dd>{form.beneficiary || '—'}</dd>
                <dt className="text-slate-500">Importe</dt>
                <dd>{form.amount || '—'} €</dd>
                <dt className="text-slate-500">Concepto</dt>
                <dd>{form.concept || '—'}</dd>
              </dl>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="flex-1 rounded-lg border border-slate-300 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Modificar
                </button>
                <button type="button" onClick={confirm} className="flex-1 rounded-lg bg-teal-700 py-2.5 font-semibold text-white hover:bg-teal-800">
                  {pending > 0 ? 'Procesando…' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Saldo disponible</p>
            <p className="text-2xl font-bold">{formatEur(bank.balance)}</p>
            <p className="mt-1 text-xs text-slate-500">Enviado hoy: {formatEur(bank.dailyTotal)}</p>
          </section>
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-2 font-sans text-sm font-semibold text-slate-900">Últimos movimientos</h3>
            {bank.transfers.length === 0 && <p className="text-sm text-slate-500">Sin movimientos hoy.</p>}
            <ul className="space-y-2">
              {bank.transfers.slice(0, 8).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate">{t.beneficiary}</span>
                    <span className="block truncate text-xs text-slate-500">{t.concept || 'Transferencia'}</span>
                  </span>
                  <span className={t.amount < 0 ? 'text-emerald-700' : 'text-slate-900'}>{formatEur(-t.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
