import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import { COMMENT_LABEL, INITIAL_PR, PR, commentExamples, commentLabels, evaluateReview, hunksFor, setComment, submitReview, type CommentKind, type PrState } from './prLogic'

type Send = (r: { state: PrState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }

const KINDS = Object.keys(COMMENT_LABEL) as CommentKind[]

/** Revisión del primer PR de tests de Lucía (curso 4, misión 3). */
export function KobaltoPrApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const hunks = hunksFor(lang)
  const labels = commentLabels(lang)
  const examples = commentExamples(lang)
  const app = (state.appState['kobalto-pr'] as PrState | undefined) ?? INITIAL_PR
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished || app.submitted
  const r = evaluateReview(app.comments)
  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>
          {PR.id} · {t(PR.title, 'Monthly statements tests (KOB-512)')}
        </span>
        <span>{t('Autora: Lucía Campos', 'Author: Lucía Campos')}</span>
      </div>
      <div className="mx-auto max-w-4xl space-y-4 p-5">
        <p className="text-sm text-slate-600">
          {t(PR.description, "Lucía's first PR: automated tests for the monthly statements API.")}{' '}
          {t(
            'Elige qué comentario dejas en cada bloque. Piensa en qué deja pasar bugs, qué es solo tu gusto, qué está bien y cómo lo va a leer alguien que lleva tres días aquí.',
            "Choose which comment you leave on each block. Think about what lets bugs through, what is just your taste, what is good, and how someone who has been here for three days will read it.",
          )}
        </p>
        <ul className="space-y-3">
          {hunks.map((h) => {
            const value = app.comments[h.id] ?? 'none'
            return (
              <li key={h.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <pre className="overflow-x-auto bg-slate-900 p-3 font-mono text-xs leading-relaxed text-emerald-200">{h.code}</pre>
                <div className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <label className="text-xs font-medium text-slate-600" htmlFor={`c-${h.id}`}>
                    {t('Tu comentario:', 'Your comment:')}
                  </label>
                  <select
                    id={`c-${h.id}`}
                    aria-label={t(`Comentario para el bloque ${h.id}`, `Comment for block ${h.id}`)}
                    value={value}
                    disabled={locked}
                    onChange={(e) => send(setComment(app, h.id, e.target.value as CommentKind, lang))}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                  >
                    {KINDS.map((k) => (
                      <option key={k} value={k}>
                        {labels[k]}
                      </option>
                    ))}
                  </select>
                  {value !== 'none' && <span className="text-xs italic text-slate-500">{value === 'helpful' && h.helpful ? h.helpful : examples[value]}</span>}
                </div>
                {app.submitted && <p className="border-t border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">{h.explanation}</p>}
              </li>
            )
          })}
        </ul>
        {!app.submitted ? (
          <button type="button" disabled={state.finished} onClick={() => send(submitReview(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
            {t('Enviar la revisión · 20 min', 'Submit the review · 20 min')}
          </button>
        ) : (
          <p className="text-sm text-slate-600">
            {t(`Revisión enviada: ${r.issuesHelpful} de ${r.issuesTotal} problemas reales comentados con el porqué`, `Review submitted: ${r.issuesHelpful} of ${r.issuesTotal} real problems commented with the why`)}
            {r.harsh ? t('; algún comentario seco', '; a curt comment') : ''}
            {r.rewrite ? t('; parte del cambio lo hiciste tú', '; part of the change you made yourself') : ''}
            {r.nitpicky ? t('; alguna preferencia de estilo como bloqueante', '; a style preference as blocking') : ''}.
          </p>
        )}
      </div>
    </div>
  )
}
