import { ISSUE_LABEL, issueLabels } from '../engine/review'
import type { IssueType } from '../engine/types'
import type { ToolProps } from './types'
import { missionLang } from '../i18n'

const TYPES = Object.keys(ISSUE_LABEL) as IssueType[]

const COPY = {
  es: {
    description: 'Descripción',
    criteria: 'Criterios de aceptación',
    title: 'Revisión de requisitos',
    intro: 'Lee la historia como si tuvieras que probarla mañana. Marca cada fragmento con un problema y elige su tipo.',
    devStarted: ' El desarrollo ya ha empezado: lo que aclares ahora ya no evita bugs.',
    beforeDev: ' Lo que aclares antes de que Diego empiece a desarrollar, no se convertirá en bug.',
    yourDefects: (n: number) => ` (${n} defecto${n === 1 ? '' : 's'} tuyo${n === 1 ? '' : 's'})`,
    send: (n: number, po: string) => `Enviar ${n > 0 ? `${n} ` : ''}duda${n === 1 ? '' : 's'} a ${po}`,
    raisedBy: (name: string) => `✓ Lo señaló ${name} en la reunión: registrado y corregido`,
    sentAs: (po: string, label: string) => `✓ Enviado a ${po} como «${label}»: aclarado en el ticket`,
    fine: (po: string) => `${po}: está claro tal como está`,
    problemIn: (text: string) => `Problema en: ${text}`,
  },
  en: {
    description: 'Description',
    criteria: 'Acceptance criteria',
    title: 'Requirements review',
    intro: "Read the story as if you had to test it tomorrow. Mark each fragment that has a problem and choose its type.",
    devStarted: ' Development has already started: what you clarify now no longer prevents bugs.',
    beforeDev: " Whatever you clarify before Diego starts developing won't turn into a bug.",
    yourDefects: (n: number) => ` (${n} defect${n === 1 ? '' : 's'} of yours)`,
    send: (n: number, po: string) => `Send ${n > 0 ? `${n} ` : ''}question${n === 1 ? '' : 's'} to ${po}`,
    raisedBy: (name: string) => `✓ Raised by ${name} in the meeting: logged and fixed`,
    sentAs: (po: string, label: string) => `✓ Sent to ${po} as “${label}”: clarified in the ticket`,
    fine: (po: string) => `${po}: it's clear as it stands`,
    problemIn: (text: string) => `Problem in: ${text}`,
  },
}

/**
 * Revisión estática de la historia: el alumno marca los fragmentos con
 * problemas (ambiguo, incompleto, contradictorio, no verificable) y se los
 * envía a la PO antes de que empiece el desarrollo.
 */
export function ReviewTool({ mission, state, dispatch }: ToolProps) {
  const model = mission.requirementsReview
  if (!model) return null
  const lang = missionLang(mission)
  const c = COPY[lang]
  const labels = issueLabels(lang)
  const ticket = mission.tickets.find((t) => t.id === model.storyId)
  const po = mission.world.npcs.find((n) => n.id === model.reviewer)?.name.split(' ')[0] ?? model.reviewer
  const pending = model.fragments.filter((f) => state.reviewMarks[f.id] && !state.reviewResults[f.id]).length
  const sections: { id: string; label: string }[] = model.sections ?? [
    { id: 'description', label: c.description },
    { id: 'criteria', label: c.criteria },
  ]
  const meeting = !!model.teamFindings && !state.flags['review.submitted']

  return (
    <div className="h-full min-h-0 overflow-y-auto p-5">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-caption text-ase-brand">
              {model.storyId} · {model.title ?? c.title}
            </p>
            <h2 className="font-sans text-heading-sm font-semibold">{ticket?.title}</h2>
            <p className="max-w-2xl text-body-sm text-ase-text2">
              {model.intro ?? c.intro}
              {state.flags['dev.started'] ? c.devStarted : model.intro ? '' : c.beforeDev}
            </p>
          </div>
          <button
            type="button"
            disabled={state.finished || (pending === 0 && !meeting)}
            onClick={() => dispatch({ type: 'reviewSubmit' })}
            className="rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong disabled:opacity-40"
          >
            {model.teamFindings && model.submitLabel
              ? `${model.submitLabel}${pending > 0 ? c.yourDefects(pending) : ''}`
              : c.send(pending, po)}{' '}
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
                            ? c.raisedBy(mission.world.npcs.find((n) => n.id === result.by)?.name.split(' ')[0] ?? result.by)
                            : c.sentAs(po, labels[mark].toLowerCase())
                          : c.fine(po)}
                      </p>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label={c.problemIn(f.text.slice(0, 40))}>
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
                            {labels[t]}
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
