import { useState } from 'react'
import type { RunState } from '../../engine/types'
import { missionLang, tr } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import {
  INITIAL_INSPECTION,
  authorFor,
  convene,
  followUp,
  peopleFor,
  reviewTypesFor,
  roleLabelFor,
  type InspectionState,
  type ReviewType,
  type Role,
} from './inspectionLogic'

const ROLES: Role[] = ['none', 'reviewer', 'moderator', 'scribe']

/** Sala de revisión: planificación de la revisión y seguimiento de las correcciones. */
export function KobaltoInspectionApp({ dispatch, state, mission }: ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const AUTHOR = authorFor(lang)
  const PEOPLE = peopleFor(lang)
  const REVIEW_TYPES = reviewTypesFor(lang)
  const ROLE_LABEL = roleLabelFor(lang)
  const app = (state.appState['kobalto-inspection'] as InspectionState | undefined) ?? INITIAL_INSPECTION
  const [type, setType] = useState<ReviewType | ''>('')
  const [roles, setRoles] = useState<Record<string, Role>>({ player: 'reviewer' })
  const [checklist, setChecklist] = useState(false)
  const convened = !!app.plan
  const met = !!state.flags['review.submitted']
  const steps = [
    { label: t('Planificación', 'Planning'), done: convened },
    { label: t('Revisión individual', 'Individual review'), done: met || Object.keys(state.reviewMarks).length > 0 },
    { label: t('Reunión', 'Review meeting'), done: met },
    { label: t('Corrección (Elena)', 'Fixing (Elena)'), done: met },
    { label: t('Seguimiento', 'Follow-up'), done: app.followUp },
  ]

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('Sala de revisión · KOB-E-12 Especificación «Facturación recurrente»', 'Review room · KOB-E-12 "Recurring billing" specification')}</span>
        <span>{t('paso a desarrollo: 16:00', 'handover to development: 4:00 PM')}</span>
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
          <h3 className="font-sans text-base font-semibold text-slate-900">1 · {t('Planificar la revisión', 'Plan the review')}</h3>
          {convened ? (
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <p>
                <span className="font-semibold">{t('Tipo:', 'Type:')}</span> {REVIEW_TYPES.find((rt) => rt.id === app.plan!.type)?.label}
              </p>
              <p>
                <span className="font-semibold">{t('Participantes:', 'Participants:')}</span> {AUTHOR.name} ({t('autora', 'author')})
                {PEOPLE.filter((p) => app.plan!.roles[p.id] && app.plan!.roles[p.id] !== 'none').map((p) => `, ${p.name} (${ROLE_LABEL[app.plan!.roles[p.id]].toLowerCase()})`)}
              </p>
              <p>
                <span className="font-semibold">Checklist:</span> {app.plan!.checklist ? t('sí', 'yes') : 'no'}
              </p>
              <p className="text-xs text-slate-500">
                {t(
                  'Convocatoria enviada. Ahora toca la revisión individual en la herramienta «Revisión».',
                  'Invitation sent. Next comes the individual review in the "Review" tool.',
                )}
              </p>
            </div>
          ) : (
            <>
              <p className="mb-3 mt-1 text-sm text-slate-600">
                {t(
                  'Elige el tipo de revisión según el objetivo y asigna los roles. Solo se convoca una vez: piénsalo bien.',
                  'Choose the review type based on the objective and assign the roles. You can only convene it once: think it through.',
                )}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {REVIEW_TYPES.map((rt) => (
                  <label key={rt.id} className={`cursor-pointer rounded-xl border p-3 text-sm ${type === rt.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="review-type" className="mr-2" checked={type === rt.id} onChange={() => setType(rt.id)} />
                    <span className="font-semibold">{rt.label}</span>
                    <span className="mt-1 block text-xs text-slate-500">{rt.summary}</span>
                  </label>
                ))}
              </div>
              <table className="mt-4 w-full text-left text-sm">
                <thead className="text-xs text-slate-500">
                  <tr>
                    <th className="py-1">{t('Persona', 'Person')}</th>
                    <th className="py-1">{t('Rol en la revisión', 'Review role')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2">
                      <span className="font-medium">{AUTHOR.name}</span>
                      <span className="block text-xs text-slate-500">{AUTHOR.note}</span>
                    </td>
                    <td className="py-2 text-slate-600">{t('Autora', 'Author')}</td>
                  </tr>
                  {PEOPLE.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2">
                        <span className="font-medium">{p.name}</span>
                        <span className="block text-xs text-slate-500">{p.note}</span>
                      </td>
                      <td className="py-2">
                        <select
                          aria-label={`${t('Rol de', 'Role for')} ${p.name}`}
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
                {t('Repartir la checklist de especificaciones del equipo (wiki) para la preparación', "Hand out the team's specification checklist (wiki) for preparation")}
              </label>
              <button
                type="button"
                disabled={!type}
                onClick={() => {
                  const r = convene(app, { type: type as ReviewType, roles, checklist }, lang)
                  dispatch({ type: 'app', event: { ...r.event, state: r.state } })
                }}
                className="mt-4 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-40"
              >
                {t('Convocar la revisión', 'Convene the review')} · 15 min
              </button>
            </>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-sans text-base font-semibold text-slate-900">2 · {t('Seguimiento de las correcciones', 'Follow-up of the fixes')}</h3>
          <p className="mt-1 text-sm text-slate-600">
            {t(
              'Después de la reunión, la autora corrige el documento. Una revisión no termina hasta comprobar que cada defecto del acta está bien cerrado.',
              'After the meeting, the author fixes the document. A review is not finished until you check that every defect in the review log is properly closed.',
            )}
          </p>
          {app.followUp ? (
            <p className="mt-2 text-sm font-medium text-emerald-700">✓ {t('Seguimiento hecho: el acta está cerrada.', 'Follow-up done: the review log is closed.')}</p>
          ) : (
            <button
              type="button"
              disabled={!met}
              onClick={() => {
                const ivaFound = !!state.flags['clarify.iva']
                const r = followUp(app, ivaFound, lang)
                dispatch({ type: 'app', event: { ...r.event, state: r.state } })
              }}
              className="mt-3 rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-50 disabled:opacity-40"
            >
              {t('Verificar las correcciones', 'Verify the fixes')} · 15 min
            </button>
          )}
          {!met && <p className="mt-1 text-xs text-slate-400">{t('Disponible después de la reunión de revisión.', 'Available after the review meeting.')}</p>}
        </section>
      </div>
    </div>
  )
}
