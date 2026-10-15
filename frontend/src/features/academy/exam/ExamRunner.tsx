import { ChevronLeft, ChevronRight, Clock, Flag, Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { saveExamAnswers, submitExam, type ExamAnswers, type ExamAttempt } from './examApi'
import { formatClock } from './studyMap'
import { useAcademyLang } from '../i18n'

const COPY = {
  es: {
    submitError: 'No se pudo entregar el examen. Comprueba tu conexión y vuelve a intentarlo.',
    answered: (a: number, t: number) => `${a} de ${t} respondidas`,
    saving: ' · guardando…',
    saved: ' · guardado',
    saveError: ' · sin conexión: se reintentará al responder',
    timeLeft: (t: string) => `Tiempo restante ${t}`,
    submit: 'Entregar',
    questionOf: (n: number, t: number) => `Pregunta ${n} de ${t}`,
    previous: 'Anterior',
    flagged: 'Marcada para revisar',
    flag: 'Marcar para revisar',
    next: 'Siguiente',
    shortcuts: 'Atajos: teclas 1–4 o A–D para responder, flechas para moverte.',
    navigator: 'Navegador de preguntas',
    questions: 'Preguntas',
    questionAria: (n: number, answered: boolean, flagged: boolean) =>
      `Pregunta ${n}${answered ? ', respondida' : ''}${flagged ? ', marcada' : ''}`,
    legendAnswered: 'Respondida',
    confirmTitle: '¿Entregar el examen?',
    unanswered: (n: number) => `Te quedan ${n} preguntas sin responder: contarán como falladas.`,
    allAnswered: 'Has respondido todas las preguntas.',
    flaggedCount: (n: number) => ` Tienes ${n} marcadas para revisar.`,
    final: ' Después ya no podrás cambiar las respuestas.',
    keepGoing: 'Seguir respondiendo',
    submitting: 'Entregando…',
    submitAndSee: 'Entregar y ver resultado',
  },
  en: {
    submitError: "The exam couldn't be submitted. Check your connection and try again.",
    answered: (a: number, t: number) => `${a} of ${t} answered`,
    saving: ' · saving…',
    saved: ' · saved',
    saveError: " · offline: we'll retry when you answer",
    timeLeft: (t: string) => `Time remaining ${t}`,
    submit: 'Submit',
    questionOf: (n: number, t: number) => `Question ${n} of ${t}`,
    previous: 'Previous',
    flagged: 'Flagged for review',
    flag: 'Flag for review',
    next: 'Next',
    shortcuts: 'Shortcuts: keys 1–4 or A–D to answer, arrow keys to move.',
    navigator: 'Question navigator',
    questions: 'Questions',
    questionAria: (n: number, answered: boolean, flagged: boolean) =>
      `Question ${n}${answered ? ', answered' : ''}${flagged ? ', flagged' : ''}`,
    legendAnswered: 'Answered',
    confirmTitle: 'Submit the exam?',
    unanswered: (n: number) => `You have ${n} unanswered ${n === 1 ? 'question' : 'questions'}: they will count as wrong.`,
    allAnswered: 'You have answered every question.',
    flaggedCount: (n: number) => ` You have ${n} flagged for review.`,
    final: " After that you won't be able to change your answers.",
    keepGoing: 'Keep answering',
    submitting: 'Submitting…',
    submitAndSee: 'Submit and see result',
  },
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function readFlags(attemptId: string): string[] {
  try {
    const raw = localStorage.getItem(`academy-exam-flags:${attemptId}`)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function writeFlags(attemptId: string, flags: string[]) {
  try {
    localStorage.setItem(`academy-exam-flags:${attemptId}`, JSON.stringify(flags))
  } catch {
    // sin almacenamiento: las marcas viven solo en memoria
  }
}

/** Pantalla del examen en curso: una pregunta cada vez, navegador, tiempo y autoguardado. */
export function ExamRunner({
  courseKey,
  attempt,
  onFinished,
}: {
  courseKey: string
  attempt: ExamAttempt
  onFinished: (attempt: ExamAttempt) => void
}) {
  const lang = useAcademyLang()
  const c = COPY[lang]
  const questions = attempt.questions
  const [answers, setAnswers] = useState<ExamAnswers>(() =>
    Object.fromEntries(questions.filter((q) => q.selected != null).map((q) => [q.id, q.selected])),
  )
  const [index, setIndex] = useState(() => Math.max(0, questions.findIndex((q) => q.selected == null)))
  const [flags, setFlags] = useState<string[]>(() => readFlags(attempt.id))
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Reloj del servidor: la hora del navegador puede ir desfasada.
  const [offset] = useState(() => new Date(attempt.serverNow).getTime() - Date.now())
  const [now, setNow] = useState(() => Date.now())
  const pending = useRef<ExamAnswers>({})
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finished = useRef(false)

  const deadline = new Date(attempt.deadlineAt).getTime()
  const remaining = deadline - (now + offset)
  const answered = questions.filter((q) => answers[q.id] != null).length
  const current = questions[index]

  const finish = useCallback(
    (result: ExamAttempt) => {
      if (finished.current) return
      finished.current = true
      onFinished(result)
    },
    [onFinished],
  )

  const flush = useCallback(async () => {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = null
    const batch = pending.current
    if (Object.keys(batch).length === 0) return
    pending.current = {}
    setSaveState('saving')
    try {
      const res = await saveExamAnswers(courseKey, attempt.id, batch, lang)
      setSaveState('saved')
      if (res.status === 'submitted') finish(res)
    } catch {
      pending.current = { ...batch, ...pending.current }
      setSaveState('error')
    }
  }, [attempt.id, courseKey, finish, lang])

  const submit = useCallback(async () => {
    if (finished.current) return
    if (debounce.current) clearTimeout(debounce.current)
    setSubmitting(true)
    setError(null)
    try {
      finish(await submitExam(courseKey, attempt.id, answers, lang))
    } catch {
      setSubmitting(false)
      setError(c.submitError)
    }
  }, [answers, attempt.id, courseKey, finish, lang, c.submitError])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (remaining <= 0 && !finished.current && !submitting) void submit()
  }, [remaining, submit, submitting])

  // Al cambiar de pestaña o cerrar, guarda lo pendiente sin esperar al debounce.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
      if (debounce.current) clearTimeout(debounce.current)
    }
  }, [flush])

  const choose = useCallback(
    (qid: string, option: number) => {
      setAnswers((prev) => ({ ...prev, [qid]: option }))
      pending.current = { ...pending.current, [qid]: option }
      if (debounce.current) clearTimeout(debounce.current)
      debounce.current = setTimeout(() => void flush(), 700)
    },
    [flush],
  )

  const toggleFlag = (qid: string) => {
    const next = flags.includes(qid) ? flags.filter((f) => f !== qid) : [...flags, qid]
    setFlags(next)
    writeFlags(attempt.id, next)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (confirming || submitting || !current) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      const key = e.key.toLowerCase()
      const byNumber = ['1', '2', '3', '4'].indexOf(key)
      const byLetter = ['a', 'b', 'c', 'd'].indexOf(key)
      const option = byNumber >= 0 ? byNumber : byLetter
      if (option >= 0 && option < current.options.length) choose(current.id, option)
      else if (e.key === 'ArrowRight') setIndex((i) => Math.min(questions.length - 1, i + 1))
      else if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choose, confirming, current, questions.length, submitting])

  if (!current) return null
  const lowTime = remaining < 5 * 60 * 1000
  const unanswered = questions.length - answered

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="sticky top-16 z-30 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-ase-border bg-ase-bg/95 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-sm font-semibold text-ase-text">{attempt.title}</p>
          <p className="text-caption text-ase-muted">
            {c.answered(answered, questions.length)}
            {saveState === 'saving' && c.saving}
            {saveState === 'saved' && c.saved}
            {saveState === 'error' && c.saveError}
          </p>
        </div>
        <p
          className={`flex items-center gap-1.5 rounded-ase-md border px-3 py-1.5 font-mono text-body-sm tabular-nums ${
            lowTime ? 'border-ase-warning/60 text-ase-warning' : 'border-ase-border text-ase-text'
          }`}
          aria-live={lowTime ? 'polite' : 'off'}
          aria-label={c.timeLeft(formatClock(remaining))}
        >
          <Clock className="h-4 w-4" aria-hidden /> {formatClock(remaining)}
        </p>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden /> {c.submit}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-labelledby="exam-question" className="rounded-ase-xl border border-ase-border bg-ase-surface p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-caption text-ase-muted">
            <span className="font-semibold text-ase-text">
              {c.questionOf(current.number, questions.length)}
            </span>
            <span>·</span>
            <span>
              {current.section} {current.sectionTitle}
            </span>
            <span className="rounded bg-ase-bg2 px-1.5 py-0.5 font-mono">K{current.k}</span>
          </div>
          <h2 id="exam-question" className="mt-3 font-sans text-body-lg font-medium leading-relaxed text-ase-text">
            {current.text}
          </h2>
          {current.code ? (
            <pre className="mt-4 overflow-x-auto rounded-ase-md border border-ase-border bg-ase-bg p-4 font-mono text-body-sm text-ase-text2">
              {current.code}
            </pre>
          ) : null}
          <div className="mt-5 space-y-2" role="radiogroup" aria-labelledby="exam-question">
            {current.options.map((option, i) => {
              const checked = answers[current.id] === i
              return (
                <label
                  key={i}
                  className={`flex cursor-pointer items-start gap-3 rounded-ase-lg border p-3.5 text-body-md transition ${
                    checked ? 'border-ase-brand bg-ase-brand/10 text-ase-text' : 'border-ase-border text-ase-text2 hover:border-ase-brand/50'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${current.id}`}
                    className="sr-only"
                    checked={checked}
                    onChange={() => choose(current.id, i)}
                  />
                  <span
                    aria-hidden
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-caption font-semibold ${
                      checked ? 'border-ase-brand bg-ase-brand text-white' : 'border-ase-border text-ase-muted'
                    }`}
                  >
                    {LETTERS[i]}
                  </span>
                  <span>{option}</span>
                </label>
              )
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="inline-flex items-center gap-1 rounded-ase-md border border-ase-border px-3 py-2 text-body-sm text-ase-text2 hover:text-ase-text disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden /> {c.previous}
            </button>
            <button
              type="button"
              onClick={() => toggleFlag(current.id)}
              aria-pressed={flags.includes(current.id)}
              className={`inline-flex items-center gap-1.5 rounded-ase-md border px-3 py-2 text-body-sm ${
                flags.includes(current.id) ? 'border-ase-gold/70 text-ase-gold' : 'border-ase-border text-ase-text2 hover:text-ase-text'
              }`}
            >
              <Flag className="h-4 w-4" aria-hidden /> {flags.includes(current.id) ? c.flagged : c.flag}
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={index === questions.length - 1}
              className="ml-auto inline-flex items-center gap-1 rounded-ase-md border border-ase-border px-3 py-2 text-body-sm text-ase-text2 hover:text-ase-text disabled:opacity-40"
            >
              {c.next} <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <p className="mt-4 hidden text-caption text-ase-muted sm:block">{c.shortcuts}</p>
        </section>

        <aside className="rounded-ase-xl border border-ase-border bg-ase-bg2 p-4" aria-label={c.navigator}>
          <p className="text-body-sm font-semibold text-ase-text">{c.questions}</p>
          <ol className="mt-3 grid grid-cols-8 gap-1.5 lg:grid-cols-5">
            {questions.map((q, i) => {
              const isAnswered = answers[q.id] != null
              const isFlagged = flags.includes(q.id)
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={i === index ? 'step' : undefined}
                    aria-label={c.questionAria(q.number, isAnswered, isFlagged)}
                    className={`relative h-9 w-full rounded-ase-sm text-caption font-semibold tabular-nums ${
                      isAnswered ? 'bg-ase-brand/80 text-white' : 'bg-ase-surface text-ase-muted'
                    } ${i === index ? 'ring-2 ring-ase-text' : ''} ${isFlagged ? 'outline outline-2 outline-ase-gold' : ''}`}
                  >
                    {q.number}
                  </button>
                </li>
              )
            })}
          </ol>
          <ul className="mt-4 space-y-1 text-caption text-ase-muted">
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-ase-brand/80" aria-hidden /> {c.legendAnswered}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm outline outline-2 outline-ase-gold" aria-hidden /> {c.flagged}
            </li>
          </ul>
        </aside>
      </div>

      {confirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="exam-confirm">
          <div className="w-full max-w-md rounded-ase-xl border border-ase-border bg-ase-surface p-6 shadow-soft">
            <h3 id="exam-confirm" className="font-sans text-heading-sm text-ase-text">
              {c.confirmTitle}
            </h3>
            <p className="mt-2 text-body-sm text-ase-text2">
              {unanswered > 0 ? c.unanswered(unanswered) : c.allAnswered}
              {flags.length > 0 ? c.flaggedCount(flags.length) : ''}
              {c.final}
            </p>
            {error ? <p className="mt-3 text-body-sm text-ase-error">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-ase-md border border-ase-border px-4 py-2 text-body-sm text-ase-text2 hover:text-ase-text"
              >
                {c.keepGoing}
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={submitting}
                className="rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong disabled:opacity-50"
              >
                {submitting ? c.submitting : c.submitAndSee}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
