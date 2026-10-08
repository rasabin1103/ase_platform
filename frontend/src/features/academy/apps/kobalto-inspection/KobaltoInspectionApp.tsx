import { useState } from 'react'
import type { RunState } from '../../engine/types'
import type { ToolProps } from '../../tools/types'
import { AUTHOR, INITIAL_INSPECTION, PEOPLE, REVIEW_TYPES, ROLE_LABEL, convene, followUp, type InspectionState, type ReviewType, type Role } from './inspectionLogic'

const ROLES: Role[] = ['none', 'reviewer', 'moderator', 'scribe']

/** Sala de revisión: planificación de la revisión y seguimiento de las correcciones. */
export function KobaltoInspectionApp({ dispatch, state }: ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }) {
  const app = (state.appState['kobalto-inspection'] as InspectionState | undefined) ?? INITIAL_INSPECTION
  const [type, setType] = useState<ReviewType | ''>('')
  const [roles, setRoles] = useState<Record<string, Role>>({ player: 'reviewer' })
  const [checklist, setChecklist] = useState(false)
  const convened = !!app.plan
  const met = !!state.flags['review.submitted']
  const steps = [
    { label: 'Planificación', done: convened },
    { label: 'Revisión individual', done: met || Object.keys(state.reviewMarks).length > 0 },
    { label: 'Reunión', done: met },
    { label: 'Corrección (Elena)', done: met },
    { label: 'Seguimiento', done: app.followUp },
  ]

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>Sala de revisión · KOB-E-12 Especificación «Facturación recurrente»</span>
        <span>paso a desarrollo: 16:00</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <ol className="flex flex-wrap gap-2 text-xs">
          {steps.map((s, i) => (
            <li key={s.label} className={`rounded-full px-3 py-1 font-medium ${s.done ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-500'}`}>
              {i + 1}. {s.label} {s.done ? '✓' : ''}
            </li>
          ))}
        </ol>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-sans text-base font-semibold text-slate-900">1 · Planificar la revisión</h3>
          {convened ? (
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Tipo:</span> {REVIEW_TYPES.find((t) => t.id === app.plan!.type)?.label}
              </p>
              <p>
                <span className="font-semibold">Participantes:</span> {AUTHOR.name} (autora)
                {PEOPLE.filter((p) => app.plan!.roles[p.id] && app.plan!.roles[p.id] !== 'none').map((p) => `, ${p.name} (${ROLE_LABEL[app.plan!.roles[p.id]].toLowerCase()})`)}
              </p>
              <p>
                <span className="font-semibold">Checklist:</span> {app.plan!.checklist ? 'sí' : 'no'}
              </p>
              <p className="text-xs text-slate-500">Convocatoria enviada. Ahora toca la revisión individual en la herramienta «Revisión».</p>
            </div>
          ) : (
            <>
              <p className="mb-3 mt-1 text-sm text-slate-600">Elige el tipo de revisión según el objetivo y asigna los roles. Solo se convoca una vez: piénsalo bien.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {REVIEW_TYPES.map((t) => (
                  <label key={t.id} className={`cursor-pointer rounded-xl border p-3 text-sm ${type === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="review-type" className="mr-2" checked={type === t.id} onChange={() => setType(t.id)} />
                    <span className="font-semibold">{t.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">{t.summary}</span>
                  </label>
                ))}
              </div>
              <table className="mt-4 w-full text-left text-sm">
                <thead className="text-xs text-slate-500">
                  <tr>
                    <th className="py-1">Persona</th>
                    <th className="py-1">Rol en la revisión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2">
                      <span className="font-medium">{AUTHOR.name}</span>
                      <span className="block text-xs text-slate-500">{AUTHOR.note}</span>
                    </td>
                    <td className="py-2 text-slate-600">Autora</td>
                  </tr>
                  {PEOPLE.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2">
                        <span className="font-medium">{p.name}</span>
                        <span className="block text-xs text-slate-500">{p.note}</span>
                      </td>
                      <td className="py-2">
                        <select
                          aria-label={`Rol de ${p.name}`}
                          value={roles[p.id] ?? 'none'}
                          onChange={(e) => setRoles((r) => ({ ...r, [p.id]: e.target.value as Role }))}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={checklist} onChange={(e) => setChecklist(e.target.checked)} />
                Repartir la checklist de especificaciones del equipo (wiki) para la preparación
              </label>
              <button
                type="button"
                disabled={!type}
                onClick={() => {
                  const r = convene(app, { type: type as ReviewType, roles, checklist })
                  dispatch({ type: 'app', event: { ...r.event, state: r.state } })
                }}
                className="mt-4 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40"
              >
                Convocar la revisión · 15 min
              </button>
            </>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-sans text-base font-semibold text-slate-900">2 · Seguimiento de las correcciones</h3>
          <p className="mt-1 text-sm text-slate-600">
            Después de la reunión, la autora corrige el documento. Una revisión no termina hasta comprobar que cada defecto del acta está bien cerrado.
          </p>
          {app.followUp ? (
            <p className="mt-2 text-sm font-medium text-emerald-700">✓ Seguimiento hecho: el acta está cerrada.</p>
          ) : (
            <button
              type="button"
              disabled={!met}
              onClick={() => {
                const ivaFound = !!state.flags['clarify.iva']
                const r = followUp(app, ivaFound)
                dispatch({ type: 'app', event: { ...r.event, state: r.state } })
              }}
              className="mt-3 rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-50 disabled:opacity-40"
            >
              Verificar las correcciones · 15 min
            </button>
          )}
          {!met && <p className="mt-1 text-xs text-slate-400">Disponible después de la reunión de revisión.</p>}
        </section>
      </div>
    </div>
  )
}
