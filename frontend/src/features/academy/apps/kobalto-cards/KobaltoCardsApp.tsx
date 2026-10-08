import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import { formatEur } from '../kobalto/transferLogic'
import {
  DEVICE_LABEL,
  HOLDER,
  INITIAL_CARDS,
  LANG_LABEL,
  LIMITS,
  PROFILE_LABEL,
  exportCsv,
  freezeLabel,
  purchase,
  screenshot,
  setLimit,
  toggleFreeze,
  type CardsState,
  type Device,
  type Env,
  type Lang,
  type Movement,
  type Profile,
  type Screen,
} from './cardLogic'

const T = {
  es: { card: 'Tarjeta', movements: 'Movimientos', active: 'Activa', frozen: 'Congelada', limit: 'Límite mensual', save: 'Guardar', spent: 'Gastado este mes', export: 'Exportar CSV', from: 'Desde', to: 'Hasta', released: 'retención liberada el' },
  en: { card: 'Card', movements: 'Transactions', active: 'Active', frozen: 'Frozen', limit: 'Monthly limit', save: 'Save', spent: 'Spent this month', export: 'Export CSV', from: 'From', to: 'To', released: 'hold released on' },
} as const

/** Sección «Tarjetas» de la app de Kobalto en beta, con laboratorio de dispositivos de staging (KOB-180). */
export function KobaltoCardsApp({ dispatch, state }: ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }) {
  const app = (state.appState['kobalto-cards'] as CardsState | undefined) ?? INITIAL_CARDS
  const build = { active: state.activeBugs, fixed: state.fixedBugs, regressions: state.activeRegressions }
  const [env, setEnv] = useState<Env>({ device: 'ios', lang: 'es', profile: 'personal' })
  const [screen, setScreen] = useState<Screen>('card')
  const [limitRaw, setLimitRaw] = useState('')
  const [amount, setAmount] = useState('20')
  const [from, setFrom] = useState('2026-09-01')
  const [to, setTo] = useState('2026-09-30')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [csv, setCsv] = useState<Movement[] | null>(null)
  const acc = app.accounts[env.profile]
  const t = T[env.lang]

  const commit = (r: { ok: boolean; message: string; state: CardsState; event: AppEvent }) => {
    dispatch({ type: 'app', event: { ...r.event, state: r.state } })
    setResult({ ok: r.ok, message: r.message })
  }

  const selCls = 'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-teal-600 focus:outline-none'
  const inCls = 'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none'
  const phoneRound = env.device === 'web' ? 'rounded-xl' : 'rounded-[2rem] border-[10px] border-slate-800'

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>⚠ STAGING · laboratorio de dispositivos · app Kobalto 5.0 beta (KOB-180)</span>
        <span>build 5.0.0-beta{1 + state.build}</span>
      </div>
      <div className="mx-auto grid max-w-5xl gap-5 p-5 md:grid-cols-[16rem_1fr]">
        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="font-sans text-sm font-semibold text-slate-900">Laboratorio de dispositivos</h3>
          <p className="text-xs text-slate-500">Elige con qué dispositivo, idioma y cuenta de pruebas usas la app.</p>
          <label className="block text-xs">
            <span className="mb-0.5 block text-slate-600">Dispositivo</span>
            <select className={selCls} value={env.device} onChange={(e) => setEnv((v) => ({ ...v, device: e.target.value as Device }))}>
              {(Object.keys(DEVICE_LABEL) as Device[]).map((d) => (
                <option key={d} value={d}>
                  {DEVICE_LABEL[d]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="mb-0.5 block text-slate-600">Idioma de la app</span>
            <select className={selCls} value={env.lang} onChange={(e) => setEnv((v) => ({ ...v, lang: e.target.value as Lang }))}>
              {(Object.keys(LANG_LABEL) as Lang[]).map((l) => (
                <option key={l} value={l}>
                  {LANG_LABEL[l]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="mb-0.5 block text-slate-600">Cuenta de pruebas</span>
            <select className={selCls} value={env.profile} onChange={(e) => { setEnv((v) => ({ ...v, profile: e.target.value as Profile })); setCsv(null) }}>
              {(Object.keys(PROFILE_LABEL) as Profile[]).map((p) => (
                <option key={p} value={p}>
                  {PROFILE_LABEL[p]} · {HOLDER[p]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: 'app', event: screenshot(app, env, screen, build) })
              setResult({ ok: true, message: 'Captura guardada en el registro' })
            }}
            className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            📸 Hacer captura de pantalla
          </button>
          <div className="rounded-lg border border-dashed border-amber-400 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-900">Comercio de pruebas</p>
            <p className="mb-2 text-[11px] text-amber-800">Simula una compra con la tarjeta de esta cuenta.</p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                commit(purchase(app, env, amount, build))
              }}
            >
              <input className={inCls} value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Importe de la compra" inputMode="decimal" />
              <button type="submit" className="rounded-lg bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-700">
                Pagar
              </button>
            </form>
          </div>
        </section>

        <div className="flex justify-center">
          <div className={`w-full max-w-sm overflow-hidden bg-white shadow-lg ${phoneRound}`}>
            <header className="bg-teal-700 px-4 py-3 text-white">
              <p className="text-xs text-teal-100">{HOLDER[env.profile]}</p>
              <p className="text-lg font-bold tracking-tight">kobalto</p>
            </header>
            <nav className="flex border-b border-slate-200 text-sm" role="tablist">
              {(['card', 'movements'] as Screen[]).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  role="tab"
                  aria-selected={screen === sc}
                  onClick={() => setScreen(sc)}
                  className={`flex-1 py-2 ${screen === sc ? 'border-b-2 border-teal-700 font-semibold text-teal-800' : 'text-slate-500'}`}
                >
                  {sc === 'card' ? t.card : t.movements}
                </button>
              ))}
            </nav>
            <div className="space-y-4 p-4">
              {result && (
                <div role="status" className={`rounded-lg px-3 py-2 text-xs ${result.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                  {result.message}
                </div>
              )}
              {screen === 'card' ? (
                <>
                  <div className={`relative rounded-xl p-4 text-white ${acc.frozen ? 'bg-slate-400' : ''}`}>
                    <p className="text-xs opacity-80">Kobalto · Visa débito</p>
                    <p className="mt-6 font-mono tracking-widest">•••• 4821</p>
                    <p className="mt-1 text-xs">{acc.frozen ? `❄ ${t.frozen}` : t.active}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => commit(toggleFreeze(app, env, build))}
                    className="w-full rounded-lg border border-teal-700 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50"
                  >
                    {freezeLabel(env, acc.frozen, build)}
                  </button>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <dt className="text-xs text-slate-500">{t.limit}</dt>
                      <dd className="font-semibold">{formatEur(acc.limit)}</dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <dt className="text-xs text-slate-500">{t.spent}</dt>
                      <dd className="font-semibold">{formatEur(acc.spent)}</dd>
                    </div>
                  </dl>
                  <form
                    className="flex items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      commit(setLimit(app, env, limitRaw, build))
                    }}
                  >
                    <label className="block flex-1 text-xs">
                      <span className="mb-0.5 block text-slate-600">
                        {t.limit} ({LIMITS[env.profile].min}–{LIMITS[env.profile].max.toLocaleString(env.lang === 'es' ? 'es-ES' : 'en-GB')} €)
                      </span>
                      <input className={inCls} value={limitRaw} onChange={(e) => setLimitRaw(e.target.value)} placeholder={env.lang === 'es' ? 'Ej.: 1.000' : 'e.g. 1,000'} />
                    </label>
                    <button type="submit" className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-teal-800">
                      {t.save}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto text-sm">
                    {acc.movements.slice(0, 30).map((m, i) => (
                      <li key={i} className="flex justify-between py-1.5">
                        <span>
                          <span className="block text-slate-800">{m.merchant}</span>
                          <span className="text-xs text-slate-500">
                            {m.date}
                            {m.released ? ` · ${t.released} ${m.released}` : ''}
                          </span>
                        </span>
                        <span className={m.released ? 'text-slate-400 line-through' : 'font-medium'}>−{formatEur(m.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <form
                    className="grid grid-cols-2 gap-2 text-xs"
                    onSubmit={(e) => {
                      e.preventDefault()
                      const r = exportCsv(app, env, from, to, build)
                      commit(r)
                      setCsv(r.rows ?? null)
                    }}
                  >
                    <label className="block">
                      <span className="mb-0.5 block text-slate-600">{t.from}</span>
                      <input type="date" className={inCls} value={from} onChange={(e) => setFrom(e.target.value)} />
                    </label>
                    <label className="block">
                      <span className="mb-0.5 block text-slate-600">{t.to}</span>
                      <input type="date" className={inCls} value={to} onChange={(e) => setTo(e.target.value)} />
                    </label>
                    <button type="submit" className="col-span-2 rounded-lg bg-teal-700 py-2 text-sm font-semibold text-white hover:bg-teal-800">
                      {t.export}
                    </button>
                  </form>
                  {csv && (
                    <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 p-2 font-mono text-[10px] leading-4 text-slate-100">
                      {['fecha;comercio;importe;estado', ...csv.map((m) => `${m.date};${m.merchant};${m.amount.toFixed(2).replace('.', ',')};${m.released ? 'retención liberada' : 'cargo'}`)].join('\n')}
                    </pre>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
