import { Award, BookOpen, Check, CircleAlert, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { CourseDef } from '../engine/types'
import type { ExamAttempt, ExamCertificate } from './examApi'
import { examDisclaimer, studyMissionFor, withExamCopy } from './studyMap'
import { useAcademyLang } from '../i18n'

const COPY = {
  es: {
    passed: 'Aprobado',
    notYet: 'Todavía no',
    scoreOf: (s: number, t: number) => `${s} de ${t}`,
    passMark: (n: number) => `Para aprobar hacen falta ${n}.`,
    timedOut: ' Se acabó el tiempo y el examen se entregó con las respuestas guardadas.',
    retry: 'Nuevo simulacro',
    back: 'Volver al resumen',
    byChapter: 'Por capítulo',
    toReview: 'Qué repasar',
    noWeak: 'Ninguna sección por debajo del 65 %. Buen trabajo.',
    reviewIn: (n: number, title: string) => `Repasar en la misión ${n} · ${title}`,
    answersReview: 'Revisión de respuestas',
    filterLabel: 'Filtrar preguntas',
    wrong: 'Falladas',
    all: 'Todas',
    noWrong: 'No hay preguntas falladas.',
    question: (n: number) => `Pregunta ${n}`,
    unanswered: ' · sin responder',
    correct: 'Correcta',
    yours: 'Tu respuesta',
    certTitle: 'Certificado de finalización ASE',
    issuedTo: 'Emitido a',
    code: 'código',
    viewCert: 'Ver certificado',
    eligible: 'Has aprobado y terminado todas las misiones.',
    issuing: 'Emitiendo…',
    getCert: 'Obtener certificado',
    howTo: 'Se obtiene al aprobar el simulacro y terminar todas las misiones del curso.',
    alreadyPassed: ' Ya has aprobado: ',
    missing: (n: number) => `te faltan ${n} misiones.`,
    allDone: 'Ya has terminado todas las misiones.',
    disclaimer: 'No es una certificación oficial de ISTQB®: acredita que has completado el curso de ASE Academy.',
  },
  en: {
    passed: 'Passed',
    notYet: 'Not yet',
    scoreOf: (s: number, t: number) => `${s} of ${t}`,
    passMark: (n: number) => `You need ${n} to pass.`,
    timedOut: ' Time ran out and the exam was submitted with your saved answers.',
    retry: 'New mock exam',
    back: 'Back to overview',
    byChapter: 'By chapter',
    toReview: 'What to review',
    noWeak: 'No section below 65 %. Good job.',
    reviewIn: (n: number, title: string) => `Review in mission ${n} · ${title}`,
    answersReview: 'Answer review',
    filterLabel: 'Filter questions',
    wrong: 'Wrong',
    all: 'All',
    noWrong: 'No wrong answers.',
    question: (n: number) => `Question ${n}`,
    unanswered: ' · unanswered',
    correct: 'Correct',
    yours: 'Your answer',
    certTitle: 'ASE certificate of completion',
    issuedTo: 'Issued to',
    code: 'code',
    viewCert: 'View certificate',
    eligible: "You've passed and completed every mission.",
    issuing: 'Issuing…',
    getCert: 'Get certificate',
    howTo: 'You earn it by passing the mock exam and completing every mission of the course.',
    alreadyPassed: " You've already passed: ",
    missing: (n: number) => `you have ${n} ${n === 1 ? 'mission' : 'missions'} left.`,
    allDone: "You've already completed every mission.",
    disclaimer: 'This is not an official ISTQB® certification: it certifies that you completed the ASE Academy course.',
  },
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function pct(correct: number, total: number) {
  return total ? Math.round((100 * correct) / total) : 0
}

/** Resultado de un intento entregado: nota, informe por capítulo, qué repasar y revisión. */
export function ExamResult({
  course,
  attempt,
  onBack,
  onRetry,
  onClaim,
  claiming,
}: {
  course: CourseDef
  attempt: ExamAttempt
  onBack: () => void
  onRetry: () => void
  onClaim: () => void
  claiming: boolean
}) {
  const lang = useAcademyLang()
  const c = withExamCopy(COPY[lang], course.key, lang)
  const result = attempt.result
  const [filter, setFilter] = useState<'all' | 'wrong'>('wrong')
  if (!result) return null
  const missionTitle = (id: string) => course.missions.find((m) => m.id === id)?.title ?? id
  const missionNumber = (id: string) => course.missions.findIndex((m) => m.id === id)
  const weak = result.sections.filter((s) => pct(s.correct, s.total) < 65)
  const reviewed = attempt.questions.filter((q) => filter === 'all' || !q.isCorrect)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div
        className={`rounded-ase-xl border p-6 sm:p-8 ${
          result.passed ? 'border-ase-success/50 bg-ase-success/10' : 'border-ase-warning/50 bg-ase-warning/10'
        }`}
      >
        <p className="text-label uppercase text-ase-muted">{attempt.title}</p>
        <h1 className="mt-2 font-display text-heading-xl text-ase-text">{result.passed ? c.passed : c.notYet}</h1>
        <p className="mt-2 text-body-lg text-ase-text2">
          <strong className="text-ase-text">{c.scoreOf(result.score, result.total)}</strong> ({result.percent} %). {c.passMark(result.passMark)}
          {result.timedOut ? c.timedOut : ''}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> {c.retry}
          </button>
          <button type="button" onClick={onBack} className="rounded-ase-md border border-ase-border px-4 py-2 text-body-sm text-ase-text2 hover:text-ase-text">
            {c.back}
          </button>
        </div>
      </div>

      <CertificateBlock
        course={course}
        certificate={result.certificate}
        eligible={result.certificateEligible}
        passed={result.passed}
        missing={result.missingMissions}
        onClaim={onClaim}
        claiming={claiming}
      />

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-ase-xl border border-ase-border bg-ase-surface p-5">
          <h2 className="font-sans text-heading-sm text-ase-text">{c.byChapter}</h2>
          <ul className="mt-4 space-y-3">
            {result.chapters.map((ch) => {
              const p = pct(ch.correct, ch.total)
              return (
                <li key={ch.key}>
                  <div className="flex items-baseline justify-between gap-3 text-body-sm">
                    <span className="text-ase-text2">
                      {ch.key}. {ch.title}
                    </span>
                    <span className="tabular-nums text-ase-text">
                      {ch.correct}/{ch.total}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-ase-bg2" aria-hidden>
                    <div className={`h-2 rounded-full ${p >= 65 ? 'bg-ase-success' : 'bg-ase-warning'}`} style={{ width: `${p}%` }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="rounded-ase-xl border border-ase-border bg-ase-surface p-5">
          <h2 className="font-sans text-heading-sm text-ase-text">{c.toReview}</h2>
          {weak.length === 0 ? (
            <p className="mt-3 text-body-sm text-ase-text2">{c.noWeak}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {weak.map((s) => {
                const mission = studyMissionFor(course.key, s.key)
                return (
                  <li key={s.key} className="rounded-ase-md border border-ase-border bg-ase-bg2 p-3 text-body-sm">
                    <p className="flex justify-between gap-3">
                      <span className="text-ase-text">
                        {s.key} {s.title}
                      </span>
                      <span className="tabular-nums text-ase-warning">
                        {s.correct}/{s.total}
                      </span>
                    </p>
                    {mission ? (
                      <Link to={`/academy/${course.key}/${mission}`} className="mt-1 inline-flex items-center gap-1 text-caption text-ase-brand hover:underline">
                        <BookOpen className="h-3.5 w-3.5" aria-hidden /> {c.reviewIn(missionNumber(mission), missionTitle(mission))}
                      </Link>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-sans text-heading-sm text-ase-text">{c.answersReview}</h2>
          <div className="flex gap-1 rounded-ase-md border border-ase-border p-1 text-body-sm" role="tablist" aria-label={c.filterLabel}>
            {(
              [
                ['wrong', c.wrong],
                ['all', c.all],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                onClick={() => setFilter(id)}
                className={`rounded px-3 py-1 ${filter === id ? 'bg-ase-brand text-white' : 'text-ase-text2'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {reviewed.length === 0 ? <p className="mt-4 text-body-sm text-ase-text2">{c.noWrong}</p> : null}
        <ol className="mt-4 space-y-4">
          {reviewed.map((q) => (
            <li key={q.id} className="rounded-ase-xl border border-ase-border bg-ase-surface p-5">
              <p className="flex flex-wrap items-center gap-2 text-caption text-ase-muted">
                <span className={`inline-flex items-center gap-1 font-semibold ${q.isCorrect ? 'text-ase-success' : 'text-ase-error'}`}>
                  {q.isCorrect ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
                  {c.question(q.number)}
                </span>
                · {q.section} {q.sectionTitle} · K{q.k}
                {q.selected == null ? c.unanswered : ''}
              </p>
              <p className="mt-2 text-body-md text-ase-text">{q.text}</p>
              {q.code ? (
                <pre className="mt-3 overflow-x-auto rounded-ase-md border border-ase-border bg-ase-bg p-3 font-mono text-body-sm text-ase-text2">{q.code}</pre>
              ) : null}
              <ul className="mt-3 space-y-1.5">
                {q.options.map((o, i) => {
                  const isRight = i === q.correct
                  const isChosen = i === q.selected
                  return (
                    <li
                      key={i}
                      className={`flex gap-2 rounded-ase-md border px-3 py-2 text-body-sm ${
                        isRight
                          ? 'border-ase-success/60 bg-ase-success/10 text-ase-text'
                          : isChosen
                            ? 'border-ase-error/60 bg-ase-error/10 text-ase-text'
                            : 'border-ase-border text-ase-text2'
                      }`}
                    >
                      <span className="font-semibold">{LETTERS[i]}.</span>
                      <span className="flex-1">{o}</span>
                      {isRight ? <span className="text-caption text-ase-success">{c.correct}</span> : isChosen ? <span className="text-caption text-ase-error">{c.yours}</span> : null}
                    </li>
                  )
                })}
              </ul>
              {q.explanation ? <p className="mt-3 text-body-sm text-ase-text2">{q.explanation}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export function CertificateBlock({
  course,
  certificate,
  eligible,
  passed,
  missing,
  onClaim,
  claiming,
}: {
  course: CourseDef
  certificate: ExamCertificate | null
  eligible: boolean
  passed: boolean
  missing: string[]
  onClaim: () => void
  claiming: boolean
}) {
  const missionTitle = (id: string) => course.missions.find((m) => m.id === id)?.title ?? id
  const lang = useAcademyLang()
  const c = withExamCopy(COPY[lang], course.key, lang)
  return (
    <section className="mt-6 rounded-ase-xl border border-ase-gold/40 bg-ase-gold/5 p-5">
      <p className="flex items-center gap-2 font-semibold text-ase-text">
        <Award className="h-5 w-5 text-ase-gold" aria-hidden /> {c.certTitle}
      </p>
      {certificate ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-body-sm text-ase-text2">
          <span>
            {c.issuedTo} {certificate.holderName} · {c.code} <span className="font-mono text-ase-text">{certificate.code}</span>
          </span>
          <Link
            to={`/academy/certificado/${certificate.code}`}
            className="ml-auto rounded-ase-md bg-ase-gold px-3 py-1.5 font-semibold text-ase-bg hover:bg-ase-gold-strong"
          >
            {c.viewCert}
          </Link>
        </div>
      ) : eligible ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 text-body-sm text-ase-text2">
          <span>{c.eligible}</span>
          <button
            type="button"
            onClick={onClaim}
            disabled={claiming}
            className="ml-auto rounded-ase-md bg-ase-gold px-3 py-1.5 font-semibold text-ase-bg hover:bg-ase-gold-strong disabled:opacity-50"
          >
            {claiming ? c.issuing : c.getCert}
          </button>
        </div>
      ) : (
        <div className="mt-2 text-body-sm text-ase-text2">
          <p>
            {c.howTo}
            {passed ? c.alreadyPassed : ' '}
            {missing.length > 0 ? c.missing(missing.length) : passed ? '' : c.allDone}
          </p>
          {missing.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {missing.map((id) => (
                <li key={id}>
                  <Link to={`/academy/${course.key}/${id}`} className="inline-flex items-center gap-1 rounded-ase-md border border-ase-border px-2 py-1 text-caption text-ase-text2 hover:text-ase-text">
                    <CircleAlert className="h-3 w-3" aria-hidden /> {missionTitle(id)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
      <p className="mt-3 text-caption text-ase-muted">{examDisclaimer(course.key, lang) ?? c.disclaimer}</p>
    </section>
  )
}
