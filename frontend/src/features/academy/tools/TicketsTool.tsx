import { useState } from 'react'
import { reviewBugReport } from '../api'
import { useAcademyUserKey } from '../useMissionRun'
import { clockLabel, evaluate, priorityLabels, severityLabels } from '../engine/engine'
import type { BugReport, Mission, Priority, ReportStatus, Severity, Ticket, TicketComment } from '../engine/types'
import { Avatar, RichText } from '../ui'
import { SEVERITY_STYLE, npcOf } from '../uiHelpers'
import type { ToolProps } from './types'
import { missionLang, type AcademyLang } from '../i18n'

const STATUS_CLS: Record<ReportStatus, string> = {
  accepted: 'bg-ase-success/15 text-ase-success',
  needs_info: 'bg-ase-warning/15 text-ase-warning',
  disputed: 'bg-ase-warning/15 text-ase-warning',
  duplicate: 'bg-white/10 text-ase-muted',
  rejected: 'bg-ase-error/15 text-ase-error',
  resolved: 'bg-ase-brand/20 text-ase-brand',
  verified: 'bg-ase-success/15 text-ase-success',
  reopened: 'bg-ase-warning/15 text-ase-warning',
}

const STATUS_LABEL: Record<AcademyLang, Record<ReportStatus, string>> = {
  es: {
    accepted: 'Aceptado',
    needs_info: 'Necesita info',
    disputed: 'En discusión',
    duplicate: 'Duplicado',
    rejected: 'Cerrado · no es un bug',
    resolved: 'Resuelto · verificar',
    verified: 'Verificado y cerrado',
    reopened: 'Reabierto',
  },
  en: {
    accepted: 'Accepted',
    needs_info: 'Needs info',
    disputed: 'Disputed',
    duplicate: 'Duplicate',
    rejected: 'Closed · not a bug',
    resolved: 'Resolved · verify',
    verified: 'Verified and closed',
    reopened: 'Reopened',
  },
}

const COPY = {
  es: {
    reportBug: '+ Reportar bug',
    stories: 'Historias del sprint',
    yourBugs: (n: number) => `Tus bugs (${n})`,
    noReports: 'Aún no has reportado nada.',
    criteria: 'Criterios de aceptación',
    comments: 'Comentarios',
    clarification: 'Aclaración',
    verifyTitle: (time: string) => `Verificar el fix (build desplegado a las ${time})`,
    verifyIntro: 'Vuelve a ejecutar en staging el caso que falló y los relacionados. Adjunta las ejecuciones del build nuevo y decide.',
    noRuns: 'Aún no has ejecutado nada en el build nuevo.',
    works: (min: number) => `Funciona: verificar y cerrar · ${min} min`,
    stillFails: (min: number) => `Sigue fallando: reabrir · ${min} min`,
    reviewOf: (name: string, score: number) => `Revisión de ${name}: ${score}/5`,
    suggestedTitle: (t: string) => `Título sugerido: «${t}»`,
    signIn: (name: string) => `Inicia sesión para pedir a ${name} una revisión detallada (IA) de este report.`,
    aiUnavailable: 'La revisión con IA no está disponible ahora mismo.',
    realSeverity: (title: string, sev: string) => `${title} (severidad real: ${sev})`,
    reviewing: 'Revisando…',
    askReview: (name: string) => `Pedir a ${name} que revise el report · 5 min`,
    aiError: 'No se pudo obtener la revisión. Inténtalo de nuevo.',
    severity: 'Severidad',
    priority: 'Prioridad',
    amended: (n: number) => `Completado ${n} ${n === 1 ? 'vez' : 'veces'}`,
    steps: 'Pasos para reproducir',
    expected: 'Resultado esperado',
    actual: 'Resultado obtenido',
    evidence: 'Evidencia',
    noEvidence: 'Sin evidencia adjunta.',
    history: 'Historial',
    verified: 'Verificado y cerrado',
    reopened: 'Reabierto',
    notRetested: ' (sin re-probar en el build nuevo)',
    amendAndResend: (name: string) => `Completar y reenviar a ${name}`,
    amendTitle: (key: string) => `Completar ${key}`,
    newBug: 'Nuevo bug',
    title: 'Título',
    titlePlaceholder: 'Qué falla y dónde',
    stepsLabel: 'Pasos para reproducir (uno por línea)',
    severityLabel: 'Severidad (cuánto daño hace)',
    priorityLabel: 'Prioridad (cuándo arreglarlo)',
    noPriority: 'Sin indicar',
    evidenceLabel: 'Evidencia (operaciones registradas en staging)',
    noOps: 'Todavía no has hecho ninguna operación en la app.',
    resend: (min: number) => `Reenviar · ${min} min`,
    submit: (min: number) => `Registrar bug · ${min} min`,
    cancel: 'Cancelar',
  },
  en: {
    reportBug: '+ Report bug',
    stories: 'Sprint stories',
    yourBugs: (n: number) => `Your bugs (${n})`,
    noReports: "You haven't reported anything yet.",
    criteria: 'Acceptance criteria',
    comments: 'Comments',
    clarification: 'Clarification',
    verifyTitle: (time: string) => `Verify the fix (build deployed at ${time})`,
    verifyIntro: 'Re-run the failing case and the related ones in staging. Attach the runs on the new build and decide.',
    noRuns: "You haven't run anything on the new build yet.",
    works: (min: number) => `It works: verify and close · ${min} min`,
    stillFails: (min: number) => `Still failing: reopen · ${min} min`,
    reviewOf: (name: string, score: number) => `${name}'s review: ${score}/5`,
    suggestedTitle: (t: string) => `Suggested title: “${t}”`,
    signIn: (name: string) => `Sign in to ask ${name} for a detailed (AI) review of this report.`,
    aiUnavailable: 'The AI review is not available right now.',
    realSeverity: (title: string, sev: string) => `${title} (actual severity: ${sev})`,
    reviewing: 'Reviewing…',
    askReview: (name: string) => `Ask ${name} to review the report · 5 min`,
    aiError: "Couldn't get the review. Please try again.",
    severity: 'Severity',
    priority: 'Priority',
    amended: (n: number) => `Completed ${n} ${n === 1 ? 'time' : 'times'}`,
    steps: 'Steps to reproduce',
    expected: 'Expected result',
    actual: 'Actual result',
    evidence: 'Evidence',
    noEvidence: 'No evidence attached.',
    history: 'History',
    verified: 'Verified and closed',
    reopened: 'Reopened',
    notRetested: ' (not retested on the new build)',
    amendAndResend: (name: string) => `Complete and resend to ${name}`,
    amendTitle: (key: string) => `Complete ${key}`,
    newBug: 'New bug',
    title: 'Title',
    titlePlaceholder: 'What fails and where',
    stepsLabel: 'Steps to reproduce (one per line)',
    severityLabel: 'Severity (how much damage it does)',
    priorityLabel: 'Priority (when to fix it)',
    noPriority: 'Not set',
    evidenceLabel: 'Evidence (operations logged in staging)',
    noOps: "You haven't performed any operations in the app yet.",
    resend: (min: number) => `Resend · ${min} min`,
    submit: (min: number) => `Log bug · ${min} min`,
    cancel: 'Cancel',
  },
}

function copyFor(mission: Mission) {
  const lang = missionLang(mission)
  return { c: COPY[lang], status: STATUS_LABEL[lang], sev: severityLabels(lang), prio: priorityLabels(lang) }
}

type View = { kind: 'ticket'; id: string } | { kind: 'report'; key: string } | { kind: 'new' }

export function TicketsTool(props: ToolProps) {
  const { mission, state } = props
  const [view, setView] = useState<View>({ kind: 'ticket', id: mission.tickets[0]?.id ?? '' })
  const { c, status } = copyFor(mission)

  return (
    <div className="grid h-full min-h-0 md:grid-cols-[18rem_1fr]">
      <aside className="min-h-0 overflow-y-auto border-b border-ase-border p-3 md:border-b-0 md:border-r">
        {/* Sin app bajo prueba no hay bugs que encontrar: el tablero solo muestra tickets. */}
        {mission.tools.some((t) => t.tool === 'app') && (
          <button
            type="button"
            onClick={() => setView({ kind: 'new' })}
            disabled={state.finished}
            className="mb-3 w-full rounded-ase-md bg-ase-brand px-3 py-2 text-body-sm font-semibold text-white transition hover:bg-ase-brand-strong disabled:opacity-40"
          >
            {c.reportBug}
          </button>
        )}
        <p className="px-1 pb-1 text-label uppercase text-ase-muted">{c.stories}</p>
        {mission.tickets.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setView({ kind: 'ticket', id: t.id })}
            className={`mb-1 w-full rounded-ase-md px-3 py-2 text-left transition hover:bg-white/5 ${
              view.kind === 'ticket' && view.id === t.id ? 'bg-white/5' : ''
            }`}
          >
            <span className="font-mono text-caption text-ase-brand">{t.id}</span>
            <span className="block text-body-sm text-ase-text">{t.title}</span>
            <span className="text-caption text-ase-muted">{t.status}</span>
          </button>
        ))}
        {mission.tools.some((t) => t.tool === 'app') && (
          <>
            <p className="px-1 pb-1 pt-4 text-label uppercase text-ase-muted">{c.yourBugs(state.reports.length)}</p>
            {state.reports.length === 0 && <p className="px-1 text-caption text-ase-muted">{c.noReports}</p>}
          </>
        )}
        {state.reports
          .slice()
          .reverse()
          .map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setView({ kind: 'report', key: r.key })}
              className={`mb-1 w-full rounded-ase-md px-3 py-2 text-left transition hover:bg-white/5 ${
                view.kind === 'report' && view.key === r.key ? 'bg-white/5' : ''
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-mono text-caption text-ase-brand">{r.key}</span>
                <span className={`rounded px-1.5 text-caption ${STATUS_CLS[r.status]}`}>{status[r.status]}</span>
              </span>
              <span className="block truncate text-body-sm text-ase-text">{r.title}</span>
            </button>
          ))}
      </aside>
      <div className="min-h-0 overflow-y-auto p-5">
        {view.kind === 'ticket' && <TicketDetail {...props} ticket={mission.tickets.find((t) => t.id === view.id)!} />}
        {view.kind === 'report' && <ReportDetail key={view.key} {...props} report={state.reports.find((r) => r.key === view.key)!} />}
        {view.kind === 'new' && (
          <NewBugForm {...props} onDone={(key) => setView(key ? { kind: 'report', key } : { kind: 'ticket', id: mission.tickets[0].id })} />
        )}
      </div>
    </div>
  )
}

function TicketDetail({ mission, state, dispatch, ticket }: ToolProps & { ticket: Ticket }) {
  const { c: t } = copyFor(mission)
  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <header>
        <p className="font-mono text-caption text-ase-brand">
          {ticket.id} · {ticket.status}
        </p>
        <h2 className="font-sans text-heading-sm font-semibold">{ticket.title}</h2>
      </header>
      <RichText text={ticket.description} />
      <section>
        <h3 className="mb-2 text-label uppercase text-ase-muted">{t.criteria}</h3>
        <ol className="ml-5 list-decimal space-y-1 text-body-sm text-ase-text2">
          {ticket.acceptanceCriteria.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ol>
      </section>
      <section className="space-y-3">
        <h3 className="text-label uppercase text-ase-muted">{t.comments}</h3>
        {[
          ...ticket.comments,
          ...(mission.requirementsReview?.storyId === ticket.id
            ? Array.from(
                new Map(
                  mission.requirementsReview.fragments
                    .filter((f) => f.issue && state.flags[f.issue.clarifyFlag])
                    .map((f) => [f.issue!.key, { author: mission.requirementsReview!.reviewer, body: `${t.clarification}: ${f.issue!.clarification}` } as TicketComment]),
                ).values(),
              )
            : []),
        ]
          .filter((c) => evaluate(mission, state, c.visibleWhen))
          .map((c, i) => {
            const npc = npcOf(mission, c.author)
            return (
              <div key={i} className="flex gap-3 rounded-ase-md bg-ase-surfaceSoft p-3">
                <Avatar npc={npc} size="sm" />
                <div>
                  <p className="text-caption text-ase-muted">{npc.name}</p>
                  <p className="text-body-sm text-ase-text2">{c.body}</p>
                </div>
              </div>
            )
          })}
      </section>
      {ticket.actions.some((a) => !state.ticketActionsDone.includes(`${ticket.id}:${a.id}`) && !(a.hiddenWhen && evaluate(mission, state, a.hiddenWhen))) && (
        <section className="flex flex-wrap gap-2">
          {ticket.actions
            .filter((a) => !state.ticketActionsDone.includes(`${ticket.id}:${a.id}`) && !(a.hiddenWhen && evaluate(mission, state, a.hiddenWhen)))
            .map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={state.finished}
                onClick={() => dispatch({ type: 'ticketAction', ticketId: ticket.id, actionId: a.id })}
                className="rounded-ase-md border border-ase-border px-3 py-2 text-body-sm text-ase-text transition hover:border-ase-brand hover:bg-ase-brand/10"
              >
                {a.label} <span className="text-caption text-ase-muted">· {a.cost} min</span>
              </button>
            ))}
        </section>
      )}
    </article>
  )
}

function VerifyPanel({ mission, state, dispatch, report }: ToolProps & { report: BugReport }) {
  const [evidence, setEvidence] = useState<number[]>([])
  const deployedAt = report.deployedAt ?? 0
  const { c } = copyFor(mission)
  const runs = state.log.filter((l) => l.at >= deployedAt).slice().reverse()
  const send = (verdict: 'close' | 'reopen') => {
    dispatch({ type: 'verifyReport', key: report.key, verdict, evidence })
    setEvidence([])
  }
  return (
    <section className="space-y-3 rounded-ase-lg border border-ase-brand/50 bg-ase-brand/5 p-4">
      <h3 className="font-sans text-body-md font-semibold">{c.verifyTitle(clockLabel(mission, deployedAt))}</h3>
      <p className="text-body-sm text-ase-text2">
        {c.verifyIntro}
      </p>
      {runs.length === 0 ? (
        <p className="text-body-sm text-ase-muted">{c.noRuns}</p>
      ) : (
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {runs.map((l) => (
            <label key={l.id} className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 hover:bg-white/5">
              <input
                type="checkbox"
                className="mt-1 accent-ase-brand"
                checked={evidence.includes(l.id)}
                onChange={(e) => setEvidence((ev) => (e.target.checked ? [...ev, l.id] : ev.filter((x) => x !== l.id)))}
              />
              <span className={`font-mono text-caption ${l.status === 'error' ? 'text-ase-warning' : 'text-ase-text2'}`}>
                #{l.id} · {clockLabel(mission, l.at)} · {l.summary}
              </span>
            </label>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={state.finished}
          onClick={() => send('close')}
          className="rounded-ase-md bg-ase-success/80 px-3 py-2 text-body-sm font-semibold text-ase-bg hover:bg-ase-success disabled:opacity-40"
        >
          {c.works(mission.verifyCost ?? 5)}
        </button>
        <button
          type="button"
          disabled={state.finished}
          onClick={() => send('reopen')}
          className="rounded-ase-md border border-ase-warning/60 px-3 py-2 text-body-sm text-ase-warning hover:bg-ase-warning/10 disabled:opacity-40"
        >
          {c.stillFails(mission.verifyCost ?? 5)}
        </button>
      </div>
    </section>
  )
}

function AiReviewPanel({ mission, state, dispatch, report }: ToolProps & { report: BugReport }) {
  const { authenticated } = useAcademyUserKey()
  const [status, setStatus] = useState<'idle' | 'loading' | 'unavailable' | 'error'>('idle')
  const mentor = npcOf(mission, mission.mentor ?? mission.reportReviewer)
  const { c } = copyFor(mission)
  const ticket = mission.tickets[0]
  if (report.aiReview) {
    const r = report.aiReview
    return (
      <section className="space-y-2 rounded-ase-lg border border-ase-border bg-ase-surfaceSoft p-4">
        <p className="flex items-center gap-2 text-body-sm font-semibold">
          <Avatar npc={mentor} size="sm" /> {c.reviewOf(mentor.name.split(' ')[0], r.score)}
        </p>
        {r.strengths.length > 0 && (
          <ul className="ml-5 list-disc text-body-sm text-ase-text2">
            {r.strengths.map((x, i) => (
              <li key={i}>✓ {x}</li>
            ))}
          </ul>
        )}
        {r.improvements.length > 0 && (
          <ul className="ml-5 list-disc text-body-sm text-ase-warning">
            {r.improvements.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        )}
        {r.suggestedTitle && <p className="text-caption text-ase-muted">{c.suggestedTitle(r.suggestedTitle)}</p>}
      </section>
    )
  }
  if (!authenticated) return <p className="text-caption text-ase-muted">{c.signIn(mentor.name.split(' ')[0])}</p>
  if (status === 'unavailable') return <p className="text-caption text-ase-muted">{c.aiUnavailable}</p>
  const ask = async () => {
    setStatus('loading')
    try {
      const bug = mission.bugs.find((b) => b.id === report.bugId)
      const res = await reviewBugReport({
        story: `${ticket?.title ?? ''}. ${ticket?.description ?? ''}`,
        acceptanceCriteria: ticket?.acceptanceCriteria ?? [],
        title: report.title,
        steps: report.steps,
        expected: report.expected,
        actual: report.actual,
        severity: report.severity,
        actualBug: bug ? c.realSeverity(bug.title, bug.severity) : undefined,
      })
      if (!res) return setStatus('unavailable')
      dispatch({ type: 'aiReview', key: report.key, ...res })
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={state.finished || status === 'loading'}
        onClick={ask}
        className="rounded-ase-md border border-ase-brand/60 px-3 py-2 text-body-sm text-ase-text hover:bg-ase-brand/10 disabled:opacity-40"
      >
        {status === 'loading' ? c.reviewing : c.askReview(mentor.name.split(' ')[0])}
      </button>
      {status === 'error' && <span className="text-caption text-ase-warning">{c.aiError}</span>}
    </div>
  )
}

function ReportDetail({ mission, state, dispatch, report }: ToolProps & { report: BugReport }) {
  const [amending, setAmending] = useState(false)
  const reviewer = npcOf(mission, mission.reportReviewer)
  const { c, status, sev, prio } = copyFor(mission)
  if (amending) {
    return <BugForm mission={mission} state={state} dispatch={dispatch} amend={report} onDone={() => setAmending(false)} />
  }
  const evidence = state.log.filter((l) => report.evidence.includes(l.id))
  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <header>
        <p className="flex items-center gap-2 font-mono text-caption text-ase-brand">
          {report.key} · {clockLabel(mission, report.at)}
          <span className={`rounded px-1.5 font-sans ${STATUS_CLS[report.status]}`}>{status[report.status]}</span>
        </p>
        <h2 className="font-sans text-heading-sm font-semibold">{report.title}</h2>
        <span className={`mt-2 inline-block rounded border px-2 text-caption ${SEVERITY_STYLE[report.severity]}`}>
          {c.severity}: {sev[report.severity]}
        </span>
        {report.priority && (
          <span className="ml-2 mt-2 inline-block rounded border border-ase-border px-2 text-caption text-ase-text2">
            {c.priority}: {prio[report.priority]}
          </span>
        )}
        {(report.amendments ?? 0) > 0 && (
          <span className="ml-2 mt-2 inline-block text-caption text-ase-muted">
            {c.amended(report.amendments ?? 0)}
          </span>
        )}
      </header>
      <Field label={c.steps} value={report.steps} />
      <Field label={c.expected} value={report.expected} />
      <Field label={c.actual} value={report.actual} />
      <section>
        <h3 className="mb-1 text-label uppercase text-ase-muted">{c.evidence}</h3>
        {evidence.length === 0 ? (
          <p className="text-body-sm text-ase-muted">{c.noEvidence}</p>
        ) : (
          evidence.map((e) => (
            <p key={e.id} className="font-mono text-caption text-ase-text2">
              #{e.id} · {e.summary}
            </p>
          ))
        )}
      </section>
      {report.bugId && report.status !== 'duplicate' && (
        <AiReviewPanel key={`ai-${report.key}`} mission={mission} state={state} dispatch={dispatch} report={report} />
      )}
      {report.status === 'resolved' && <VerifyPanel key={report.key} mission={mission} state={state} dispatch={dispatch} report={report} />}
      {(report.verifications ?? []).length > 0 && (
        <section>
          <h3 className="mb-1 text-label uppercase text-ase-muted">{c.history}</h3>
          <ul className="space-y-1 text-body-sm text-ase-text2">
            {(report.verifications ?? []).map((v, i) => (
              <li key={i}>
                {clockLabel(mission, v.at)} · {v.verdict === 'close' ? c.verified : c.reopened}
                {!v.retested && c.notRetested}
              </li>
            ))}
          </ul>
        </section>
      )}
      {report.feedback.length > 0 && (
        <section className="flex gap-3 rounded-ase-md bg-ase-surfaceSoft p-3">
          <Avatar npc={reviewer} size="sm" />
          <ul className="space-y-1 text-body-sm text-ase-text2">
            {report.feedback.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      )}
      {(report.status === 'needs_info' || report.status === 'disputed') && !state.finished && (
        <button
          type="button"
          onClick={() => setAmending(true)}
          className="rounded-ase-md border border-ase-brand/60 px-3 py-2 text-body-sm text-ase-text hover:bg-ase-brand/10"
        >
          {c.amendAndResend(reviewer.name.split(' ')[0])}
        </button>
      )}
    </article>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <section>
      <h3 className="mb-1 text-label uppercase text-ase-muted">{label}</h3>
      <p className="whitespace-pre-wrap text-body-sm text-ase-text2">{value || '—'}</p>
    </section>
  )
}

const inputCls =
  'w-full rounded-ase-md border border-ase-border bg-ase-bg px-3 py-2 text-body-sm text-ase-text placeholder:text-ase-muted/70 focus:border-ase-brand focus:outline-none'

function NewBugForm(props: ToolProps & { onDone: (key?: string) => void }) {
  return <BugForm {...props} />
}

function BugForm({ mission, state, dispatch, onDone, amend }: ToolProps & { onDone: (key?: string) => void; amend?: BugReport }) {
  const [title, setTitle] = useState(amend?.title ?? '')
  const [steps, setSteps] = useState(amend?.steps ?? '')
  const [expected, setExpected] = useState(amend?.expected ?? '')
  const [actual, setActual] = useState(amend?.actual ?? '')
  const [severity, setSeverity] = useState<Severity>(amend?.severity ?? 'medium')
  const [priority, setPriority] = useState<Priority | ''>(amend?.priority ?? '')
  const [evidence, setEvidence] = useState<number[]>(amend?.evidence ?? [])
  const log = state.log.slice().reverse()
  const reviewer = npcOf(mission, mission.reportReviewer)
  const { c, sev, prio } = copyFor(mission)

  const submit = () => {
    const report = { title, steps, expected, actual, severity, evidence, ...(priority ? { priority } : {}) }
    if (amend) {
      dispatch({ type: 'amendReport', key: amend.key, report })
      onDone(amend.key)
      return
    }
    dispatch({ type: 'report', report })
    onDone(`${mission.ticketPrefix}-${201 + state.reports.length}`)
  }

  return (
    <form
      className="mx-auto max-w-2xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <h2 className="font-sans text-heading-sm font-semibold">{amend ? c.amendTitle(amend.key) : c.newBug}</h2>
      {amend && amend.feedback[0] && (
        <p className="rounded-ase-md bg-ase-warning/10 px-3 py-2 text-body-sm text-ase-warning">
          {reviewer.name.split(' ')[0]}: {amend.feedback[0]}
        </p>
      )}
      <label className="block space-y-1">
        <span className="text-label uppercase text-ase-muted">{c.title}</span>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={c.titlePlaceholder} />
      </label>
      <label className="block space-y-1">
        <span className="text-label uppercase text-ase-muted">{c.stepsLabel}</span>
        <textarea className={`${inputCls} min-h-24`} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={'1. …\n2. …'} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-label uppercase text-ase-muted">{c.expected}</span>
          <textarea className={`${inputCls} min-h-20`} value={expected} onChange={(e) => setExpected(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-label uppercase text-ase-muted">{c.actual}</span>
          <textarea className={`${inputCls} min-h-20`} value={actual} onChange={(e) => setActual(e.target.value)} />
        </label>
      </div>
      <div className={`grid gap-4 ${mission.reportPriority ? 'md:grid-cols-2' : ''}`}>
        <label className="block space-y-1">
          <span className="text-label uppercase text-ase-muted">{c.severityLabel}</span>
          <select className={inputCls} value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
            {(['critical', 'high', 'medium', 'low'] as Severity[]).map((s) => (
              <option key={s} value={s}>
                {sev[s]}
              </option>
            ))}
          </select>
        </label>
        {mission.reportPriority && (
          <label className="block space-y-1">
            <span className="text-label uppercase text-ase-muted">{c.priorityLabel}</span>
            <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value as Priority | '')}>
              <option value="">{c.noPriority}</option>
              {(['p1', 'p2', 'p3', 'p4'] as Priority[]).map((p) => (
                <option key={p} value={p}>
                  {prio[p]}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <fieldset className="space-y-1">
        <legend className="text-label uppercase text-ase-muted">{c.evidenceLabel}</legend>
        {log.length === 0 && <p className="text-body-sm text-ase-muted">{c.noOps}</p>}
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {log.map((l) => (
            <label key={l.id} className="flex cursor-pointer items-start gap-2 rounded px-2 py-1 hover:bg-white/5">
              <input
                type="checkbox"
                className="mt-1 accent-ase-brand"
                checked={evidence.includes(l.id)}
                onChange={(e) => setEvidence((ev) => (e.target.checked ? [...ev, l.id] : ev.filter((x) => x !== l.id)))}
              />
              <span className={`font-mono text-caption ${l.status === 'error' ? 'text-ase-warning' : 'text-ase-text2'}`}>
                #{l.id} · {clockLabel(mission, l.at)} · {l.summary}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={state.finished || !title.trim()}
          className="rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white transition hover:bg-ase-brand-strong disabled:opacity-40"
        >
          {amend ? c.resend(Math.ceil(mission.reportCost / 2)) : c.submit(mission.reportCost)}
        </button>
        <button type="button" onClick={() => onDone()} className="rounded-ase-md px-4 py-2 text-body-sm text-ase-muted hover:text-ase-text">
          {c.cancel}
        </button>
      </div>
    </form>
  )
}
