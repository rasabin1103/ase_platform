import { ISSUE_LABEL } from '../engine/review'
import type { IssueType } from '../engine/types'
import type { ToolProps } from './types'

const TYPES = Object.keys(ISSUE_LABEL) as IssueType[]

/**
 * Revisión estática de la historia: el alumno marca los fragmentos con
 * problemas (ambiguo, incompleto, contradictorio, no verificable) y se los
 * envía a la PO antes de que empiece el desarrollo.
 */
export function ReviewTool({ mission, state, dispatch }: ToolProps) {
  const model = mission.requirementsReview
  if (!model) return null
  const ticket = mission.tickets.find((t) => t.id === model.storyId)
  const po = mission.world.npcs.find((n) => n.id === model.reviewer)?.name.split(' ')[0] ?? model.reviewer
  const pending = model.fragments.filter((f) => state.reviewMarks[f.id] && !state.reviewResults[f.id]).length
  const sections: { id: string; label: string }[] = model.sections ?? [
    { id: 'description', label: 'Descripción' },
    { id: 'criteria', label: 'Criterios de aceptación' },
  ]
  const meeting = !!model.teamFindings && !state.flags['review.submitted']

  return (
    <div className="h-full min-h-0 overflow-y-auto p-5">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-caption text-ase-brand">
              {model.storyId} · {model.title ?? 'Revisión de requisitos'}
            </p>
            <h2 className="font-sans text-heading-sm font-semibold">{ticket?.title}</h2>
            <p className="max-w-2xl text-body-sm text-ase-text2">
              {model.intro ?? 'Lee la historia como si tuvieras que probarla mañana. Marca cada fragmento con un problema y elige su tipo.'}
              {state.flags['dev.started']
                ? ' El desarrollo ya ha empezado: lo que aclares ahora ya no evita bugs.'
                : model.intro
                  ? ''
                  : ' Lo que aclares antes de que Diego empiece a desarrollar, no se convertirá en bug.'}
            </p>
          </div>
          <button
            type="button"
            disabled={state.finished || (pending === 0 && !meeting)}
            onClick={() => dispatch({ type: 'reviewSubmit' })}
            className="rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong disabled:opacity-40"
          >
            {model.teamFindings && model.submitLabel
              ? `${model.submitLabel}${pending > 0 ? ` (${pending} defecto${pending === 1 ? '' : 's'} tuyo${pending === 1 ? '' : 's'})` : ''}`
              : `Enviar ${pending > 0 ? `${pending} ` : ''}duda${pending === 1 ? '' : 's'} a ${po}`}{' '}
            · {model.submitCost} min
          </button>
        </header>

        {sections.map((sec) => (
          <section key={sec.id} className="space-y-2">
            <h3 className="text-label uppercase text-ase-muted">{sec.label}</h3>
            {model.fragments
              .filter((f) => f.section === sec.id)
              .map((f) => {
                const mark = state.reviewMarks[f.id]
                const result = state.reviewResults[f.id]
                return (
                  <div
                    key={f.id}
                    className={`rounded-ase-md border p-3 ${
                      result ? (result.correct ? 'border-ase-success/40 bg-ase-success/5' : 'border-ase-border bg-ase-bg2') : mark ? 'border-ase-warning/60 bg-ase-warning/5' : 'border-ase-border bg-ase-surface'
                    }`}
                  >
                    <p className="text-body-sm text-ase-text">{f.text}</p>
                    {result ? (
                      <p className={`mt-1 text-caption ${result.correct ? 'text-ase-success' : 'text-ase-muted'}`}>
                        {result.correct
                          ? result.by
                            ? `✓ Lo señaló ${mission.world.npcs.find((n) => n.id === result.by)?.name.split(' ')[0] ?? result.by} en la reunión: registrado y corregido`
                            : `✓ Enviado a ${po} como «${ISSUE_LABEL[mark].toLowerCase()}»: aclarado en el ticket`
                          : `${po}: está claro tal como está`}
                      </p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label={`Problema en: ${f.text.slice(0, 40)}`}>
                        {TYPES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            disabled={state.finished}
                            aria-pressed={mark === t}
                            onClick={() => dispatch({ type: 'reviewMark', fragmentId: f.id, issue: mark === t ? null : t })}
                            className={`rounded-ase-pill border px-2.5 py-0.5 text-caption ${
                              mark === t ? 'border-ase-warning bg-ase-warning/20 text-ase-text' : 'border-ase-border text-ase-muted hover:text-ase-text'
                            }`}
                          >
                            {ISSUE_LABEL[t]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
          </section>
        ))}
      </div>
    </div>
  )
}
