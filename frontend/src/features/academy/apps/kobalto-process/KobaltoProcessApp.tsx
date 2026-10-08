import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import {
  ACTIVITIES,
  CASES,
  CONDITIONS,
  DEFECTS,
  INITIAL_PROCESS,
  ROLE_LABEL,
  STORIES,
  TESTWARE,
  TRACE_TOTAL,
  askLaura,
  propose,
  sendTrace,
  setActivity,
  setLink,
  type ActivityId,
  type ProcessState,
  type RoleId,
} from './processLogic'

type Send = (r: { state: ProcessState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }

/** Mapa del proceso de pruebas y matriz de trazabilidad del squad Empresas. */
export function KobaltoProcessApp({ dispatch, state }: Props) {
  const app = (state.appState['kobalto-process'] as ProcessState | undefined) ?? INITIAL_PROCESS
  const [tab, setTab] = useState<'process' | 'trace'>('process')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const devStarted = !!state.flags['dev.started']
  const allDone = !!app.proposed && !!app.traceSent

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>Proceso de pruebas · squad Kobalto Empresas</span>
        <span>Carmen: 14:00 · comité: 15:00</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <div className="flex gap-2 text-sm" role="tablist" aria-label="Secciones">
          <button type="button" role="tab" aria-selected={tab === 'process'} onClick={() => setTab('process')} className={`rounded-full px-4 py-1.5 font-medium ${tab === 'process' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}>
            Mapa del proceso
          </button>
          <button type="button" role="tab" aria-selected={tab === 'trace'} onClick={() => setTab('trace')} className={`rounded-full px-4 py-1.5 font-medium ${tab === 'trace' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}>
            Trazabilidad
          </button>
        </div>
        {tab === 'process' ? (
          <ProcessView app={app} send={send} locked={!!app.proposed || devStarted} />
        ) : (
          <TraceView app={app} send={send} locked={!!app.traceSent || devStarted} />
        )}
        {app.feedback && !allDone && (
          <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900">
            <h4 className="font-sans font-semibold text-violet-900">Revisión de Laura</h4>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {app.feedback.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </section>
        )}
        {!allDone && !devStarted && (
          <button type="button" onClick={() => send(askLaura(app))} className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-50">
            Pedir a Laura que revise · 10 min
          </button>
        )}
      </div>
    </div>
  )
}

function ProcessView({ app, send, locked }: { app: ProcessState; send: Send; locked: boolean }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-sans text-base font-semibold text-slate-900">Actividades del proceso de pruebas</h3>
      <p className="mt-1 text-sm text-slate-600">
        Ordena las actividades, indica qué testware produce cada una y quién es responsable. El proceso se adapta al contexto, pero las actividades son siempre estas.
      </p>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2">Orden</th>
            <th className="py-2">Actividad</th>
            <th className="py-2">Testware que produce</th>
            <th className="py-2">Responsable</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ACTIVITIES.map((a) => {
            const p = app.plan[a.id]
            return (
              <tr key={a.id}>
                <td className="py-2 pr-2">
                  <select
                    aria-label={`Orden de ${a.label}`}
                    disabled={locked}
                    value={p.position ?? ''}
                    onChange={(e) => send(setActivity(app, a.id as ActivityId, { position: e.target.value ? Number(e.target.value) : null }))}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1"
                  >
                    <option value="">—</option>
                    {ACTIVITIES.map((_, i) => (
                      <option key={i} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-2">
                  <span className="font-medium">{a.label}</span>
                  <span className="block text-xs text-slate-500">{a.summary}</span>
                </td>
                <td className="py-2 pr-2">
                  <select
                    aria-label={`Testware de ${a.label}`}
                    disabled={locked}
                    value={p.testware}
                    onChange={(e) => send(setActivity(app, a.id as ActivityId, { testware: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1"
                  >
                    <option value="">Elige…</option>
                    {TESTWARE.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2">
                  <select
                    aria-label={`Responsable de ${a.label}`}
                    disabled={locked}
                    value={p.role}
                    onChange={(e) => send(setActivity(app, a.id as ActivityId, { role: e.target.value as RoleId | '' }))}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1"
                  >
                    <option value="">Elige…</option>
                    {(Object.keys(ROLE_LABEL) as RoleId[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {app.proposed ? (
        <p className="mt-4 text-sm font-medium text-emerald-700">✓ Propuesta enviada a Raúl para el comité de las 15:00.</p>
      ) : (
        <button
          type="button"
          disabled={locked}
          onClick={() => send(propose(app))}
          className="mt-4 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40"
        >
          Enviar la propuesta de proceso a Raúl · 15 min
        </button>
      )}
    </section>
  )
}

function LinkSelect({
  id,
  label,
  value,
  options,
  locked,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: { id: string; label: string }[]
  locked: boolean
  onChange: (v: string) => void
}) {
  return (
    <li className="flex flex-wrap items-center gap-2 py-1.5 text-sm">
      <span className="min-w-0 flex-1">{label}</span>
      <span className="text-slate-400">→</span>
      <select aria-label={`Enlace de ${id}`} disabled={locked} value={value} onChange={(e) => onChange(e.target.value)} className="w-72 rounded-lg border border-slate-300 bg-white px-2 py-1">
        <option value="">Sin enlazar</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </li>
  )
}

function TraceView({ app, send, locked }: { app: ProcessState; send: Send; locked: boolean }) {
  const link = (from: string, to: string) => send(setLink(app, from, to))
  return (
    <section className="space-y-4">
      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-sans text-base font-semibold text-slate-900">Matriz de trazabilidad · Tarjetas de equipo</h3>
        <p className="mt-1 text-sm text-slate-600">
          Enlaza cada elemento con el que lo origina. Con la cadena completa (historia → condición → caso → defecto) se puede responder qué requisitos están probados y cuáles tienen defectos abiertos.
        </p>
      </article>
      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <h4 className="font-sans text-sm font-semibold uppercase tracking-wide text-slate-500">Condiciones → historia</h4>
        <ul className="divide-y divide-slate-100">
          {CONDITIONS.map((c) => (
            <LinkSelect key={c.id} id={c.id} label={c.label} value={app.links[c.id] ?? ''} options={STORIES} locked={locked} onChange={(v) => link(c.id, v)} />
          ))}
        </ul>
      </article>
      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <h4 className="font-sans text-sm font-semibold uppercase tracking-wide text-slate-500">Casos → condición</h4>
        <ul className="divide-y divide-slate-100">
          {CASES.map((t) => (
            <LinkSelect key={t.id} id={t.id} label={t.label} value={app.links[t.id] ?? ''} options={CONDITIONS} locked={locked} onChange={(v) => link(t.id, v)} />
          ))}
        </ul>
      </article>
      <article className="rounded-2xl bg-white p-5 shadow-sm">
        <h4 className="font-sans text-sm font-semibold uppercase tracking-wide text-slate-500">Defectos → caso que los detectó</h4>
        <ul className="divide-y divide-slate-100">
          {DEFECTS.map((d) => (
            <LinkSelect key={d.id} id={d.id} label={d.label} value={app.links[d.id] ?? ''} options={CASES} locked={locked} onChange={(v) => link(d.id, v)} />
          ))}
        </ul>
      </article>
      {app.traceSent ? (
        <p className="text-sm font-medium text-emerald-700">
          ✓ Matriz enviada a Carmen ({app.traceSent.correct} de {TRACE_TOTAL} enlaces correctos).
        </p>
      ) : (
        <button
          type="button"
          disabled={locked}
          onClick={() => send(sendTrace(app))}
          className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40"
        >
          Enviar la matriz a Carmen · 10 min
        </button>
      )}
    </section>
  )
}
