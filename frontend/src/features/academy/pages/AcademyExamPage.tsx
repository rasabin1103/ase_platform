import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Award, Check, CircleAlert, Clock, FileQuestion, Play, ShoppingCart, Target } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { catalogItemPath } from '../api'
import { getCourse } from '../content/courseList'
import { CertificateBlock, ExamResult } from '../exam/ExamResult'
import { ExamRunner } from '../exam/ExamRunner'
import { claimCertificate, getExamAttempt, getExamOverview, startExam, type ExamAttempt, type ExamOverview } from '../exam/examApi'
import { useCourseAccess } from '../useCourseAccess'
import { useAcademyUserKey } from '../useMissionRun'
import { useAcademyLang, type AcademyLang } from '../i18n'

const DATE_FMT: Record<AcademyLang, Intl.DateTimeFormat> = {
  es: new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }),
  en: new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
}

const COPY = {
  es: {
    noCourse: 'Este curso no existe.',
    allCourses: 'Ver todos los cursos',
    loadingExam: 'Cargando el examen…',
    attemptNotFound: 'No hemos encontrado ese intento.',
    backToExam: 'Volver al simulacro',
    forbidden: 'El simulacro está incluido en el curso completo.',
    startError: 'No se pudo empezar el simulacro. Inténtalo de nuevo.',
    defaultTitle: 'Simulacro de examen',
    intro:
      'Mismo formato que el examen: preguntas de opción múltiple con el reparto oficial por capítulo, tiempo limitado y corrección al entregar, con un informe de qué repasar y en qué misión.',
    noExam: 'Este curso todavía no tiene simulacro.',
    loading: 'Cargando…',
    signInPrompt: 'Inicia sesión para hacer el simulacro y guardar tus resultados.',
    signIn: 'Iniciar sesión',
    includedInFull: 'El simulacro y el certificado están incluidos en el curso completo.',
    unlock: 'Desbloquear curso completo',
    inProgress: 'Tienes un simulacro en curso. El tiempo sigue corriendo.',
    continue: 'Continuar',
    extended: (ext: number, min: number) =>
      `El examen no es en mi lengua materna: quiero el tiempo ampliado (${ext} minutos en lugar de ${min}), como en el examen real.`,
    clockHint: 'El reloj empieza al pulsar. Las respuestas se guardan solas; si se acaba el tiempo, se entrega lo guardado.',
    preparing: 'Preparando…',
    newExam: 'Nuevo simulacro',
    startExam: 'Empezar simulacro',
    attempts: 'Tus intentos',
    thDate: 'Fecha',
    thScore: 'Nota',
    thResult: 'Resultado',
    inCourse: 'En curso',
    passed: 'Aprobado',
    notPassed: 'No aprobado',
    timedOut: ' · sin tiempo',
    viewReport: 'Ver informe',
    disclaimer:
      'Preparación no oficial para el examen ISTQB® Certified Tester Foundation Level v4.0. ISTQB® es una marca registrada del International Software Testing Qualifications Board. Las preguntas son originales de ASE Academy.',
    cards: {
      questions: 'Preguntas',
      questionsHint: 'Opción múltiple, una respuesta',
      time: 'Tiempo',
      timeHint: (n: number) => `${n} min si no es tu lengua materna`,
      toPass: 'Para aprobar',
      toPassValue: (n: number) => `${n} aciertos`,
      best: 'Mejor nota',
      bestHint: (n: number) => `${n} simulacros distintos sin repetir`,
      distribution: 'Reparto por capítulo',
      finished: (d: number, t: number) => `Misiones terminadas: ${d} de ${t}`,
    },
  },
  en: {
    noCourse: "This course doesn't exist.",
    allCourses: 'See all courses',
    loadingExam: 'Loading the exam…',
    attemptNotFound: "We couldn't find that attempt.",
    backToExam: 'Back to the mock exam',
    forbidden: 'The mock exam is included in the full course.',
    startError: "The mock exam couldn't be started. Please try again.",
    defaultTitle: 'Mock exam',
    intro:
      'Same format as the real exam: multiple-choice questions with the official distribution per chapter, a time limit and scoring on submission, plus a report on what to review and in which mission.',
    noExam: "This course doesn't have a mock exam yet.",
    loading: 'Loading…',
    signInPrompt: 'Sign in to take the mock exam and save your results.',
    signIn: 'Sign in',
    includedInFull: 'The mock exam and the certificate are included in the full course.',
    unlock: 'Unlock the full course',
    inProgress: 'You have a mock exam in progress. The clock is still running.',
    continue: 'Continue',
    extended: (ext: number, min: number) =>
      `The exam is not in my native language: I want extended time (${ext} minutes instead of ${min}), as in the real exam.`,
    clockHint: 'The clock starts when you click. Answers are saved automatically; if time runs out, your saved answers are submitted.',
    preparing: 'Preparing…',
    newExam: 'New mock exam',
    startExam: 'Start mock exam',
    attempts: 'Your attempts',
    thDate: 'Date',
    thScore: 'Score',
    thResult: 'Result',
    inCourse: 'In progress',
    passed: 'Passed',
    notPassed: 'Not passed',
    timedOut: ' · out of time',
    viewReport: 'View report',
    disclaimer:
      'Unofficial preparation for the ISTQB® Certified Tester Foundation Level v4.0 exam. ISTQB® is a registered trademark of the International Software Testing Qualifications Board. Questions are original ASE Academy content.',
    cards: {
      questions: 'Questions',
      questionsHint: 'Multiple choice, one answer',
      time: 'Time',
      timeHint: (n: number) => `${n} min if it's not your native language`,
      toPass: 'To pass',
      toPassValue: (n: number) => `${n} correct`,
      best: 'Best score',
      bestHint: (n: number) => `${n} distinct mock exams without repeats`,
      distribution: 'Distribution by chapter',
      finished: (d: number, t: number) => `Missions completed: ${d} of ${t}`,
    },
  },
}

/** /academy/:courseKey/simulacro — resumen, examen en curso y resultado. */
export function AcademyExamPage() {
  const { courseKey = '' } = useParams()
  const lang = useAcademyLang()
  const c = COPY[lang]
  const course = getCourse(courseKey, lang)
  const [params, setParams] = useSearchParams()
  const attemptId = params.get('intento')
  const queryClient = useQueryClient()
  const { userKey, authReady, authenticated } = useAcademyUserKey()
  const { access } = useCourseAccess(courseKey, !!course)
  const [extended, setExtended] = useState(false)

  const overviewKey = ['academy-exam', courseKey, userKey, lang]
  const attemptKey = ['academy-exam-attempt', courseKey, attemptId, lang]
  const overview = useQuery({
    queryKey: overviewKey,
    queryFn: () => getExamOverview(courseKey, lang),
    enabled: authReady && !!course,
    retry: false,
  })
  const attempt = useQuery({
    queryKey: attemptKey,
    queryFn: () => getExamAttempt(courseKey, attemptId as string, lang),
    enabled: authReady && authenticated && !!attemptId,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const showAttempt = (res: ExamAttempt) => {
    queryClient.setQueryData(['academy-exam-attempt', courseKey, res.id, lang], res)
    setParams({ intento: res.id })
  }
  const start = useMutation({
    mutationFn: () => startExam(courseKey, extended, lang),
    onSuccess: (res) => {
      showAttempt(res)
      void queryClient.invalidateQueries({ queryKey: ['academy-exam', courseKey] })
    },
  })
  const claim = useMutation({
    mutationFn: () => claimCertificate(courseKey, lang),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['academy-exam', courseKey] })
      void queryClient.invalidateQueries({ queryKey: ['academy-exam-attempt', courseKey] })
    },
  })
  const backToOverview = () => {
    setParams({})
    void queryClient.invalidateQueries({ queryKey: ['academy-exam', courseKey] })
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="mb-4 text-ase-text2">{c.noCourse}</p>
        <Link to="/academy" className="text-ase-brand hover:underline">
          {c.allCourses}
        </Link>
      </div>
    )
  }

  if (attemptId && authenticated) {
    if (attempt.isLoading) return <p className="px-4 py-24 text-center text-ase-muted">{c.loadingExam}</p>
    if (attempt.isError || !attempt.data) {
      return (
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <p className="mb-4 text-ase-text2">{c.attemptNotFound}</p>
          <button type="button" onClick={backToOverview} className="text-ase-brand hover:underline">
            {c.backToExam}
          </button>
        </div>
      )
    }
    const data = attempt.data
    if (data.status === 'in_progress') {
      return (
        <ExamRunner
          key={data.id}
          courseKey={courseKey}
          attempt={data}
          onFinished={(res) => {
            queryClient.setQueryData(attemptKey, res)
            void queryClient.invalidateQueries({ queryKey: ['academy-exam', courseKey] })
            window.scrollTo({ top: 0 })
          }}
        />
      )
    }
    return (
      <ExamResult
        course={course}
        attempt={data}
        onBack={backToOverview}
        onRetry={() => start.mutate()}
        onClaim={() => claim.mutate()}
        claiming={claim.isPending}
      />
    )
  }

  const info = overview.data
  const buyPath = catalogItemPath(access)
  const startError = start.error
    ? isAxiosError(start.error) && start.error.response?.status === 403
      ? c.forbidden
      : c.startError
    : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <Link to={`/academy/${course.key}`} className="mb-6 inline-flex items-center gap-1 text-body-sm text-ase-muted hover:text-ase-text">
        <ArrowLeft className="h-4 w-4" aria-hidden /> {course.title}
      </Link>
      <header className="max-w-3xl space-y-2">
        <p className="text-caption text-ase-muted">ASE Academy · {course.track}</p>
        <h1 className="font-display text-display-lg">{info?.config.title ?? c.defaultTitle}</h1>
        <p className="text-body-lg text-ase-text2">
          {c.intro}
        </p>
      </header>

      {overview.isError ? (
        <p className="mt-8 flex items-center gap-2 text-body-sm text-ase-muted">
          <CircleAlert className="h-4 w-4" aria-hidden /> {c.noExam}
        </p>
      ) : !info ? (
        <p className="mt-8 text-ase-muted">{c.loading}</p>
      ) : (
        <>
          <FormatCards info={info} copy={c.cards} />

          <section className="mt-8 rounded-ase-xl border border-ase-border bg-ase-surface p-5 sm:p-6">
            {!info.authenticated ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-body-sm text-ase-text2">{c.signInPrompt}</p>
                <Link
                  to={`/login?next=${encodeURIComponent(`/academy/${course.key}/simulacro`)}`}
                  className="ml-auto rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong"
                >
                  {c.signIn}
                </Link>
              </div>
            ) : !info.hasAccess ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-body-sm text-ase-text2">{c.includedInFull}</p>
                {buyPath ? (
                  <Link
                    to={buyPath}
                    className="ml-auto inline-flex items-center gap-2 rounded-ase-md bg-ase-gold px-3 py-1.5 font-semibold text-ase-bg hover:bg-ase-gold-strong"
                  >
                    <ShoppingCart className="h-4 w-4" aria-hidden /> {c.unlock}
                  </Link>
                ) : null}
              </div>
            ) : info.inProgressId ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-body-sm text-ase-text2">{c.inProgress}</p>
                <button
                  type="button"
                  onClick={() => setParams({ intento: info.inProgressId as string })}
                  className="ml-auto inline-flex items-center gap-2 rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong"
                >
                  <Play className="h-4 w-4" aria-hidden /> {c.continue}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="flex items-start gap-3 text-body-sm text-ase-text2">
                  <input type="checkbox" className="mt-1" checked={extended} onChange={(e) => setExtended(e.target.checked)} />
                  <span>{c.extended(info.config.extendedMinutes, info.config.minutes)}</span>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-caption text-ase-muted">
                    {c.clockHint}
                  </p>
                  <button
                    type="button"
                    onClick={() => start.mutate()}
                    disabled={start.isPending}
                    className="ml-auto inline-flex items-center gap-2 rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong disabled:opacity-50"
                  >
                    <Play className="h-4 w-4" aria-hidden /> {start.isPending ? c.preparing : info.attempts.length ? c.newExam : c.startExam}
                  </button>
                </div>
                {startError ? <p className="text-body-sm text-ase-error">{startError}</p> : null}
              </div>
            )}
          </section>

          {info.authenticated ? (
            <CertificateBlock
              course={course}
              certificate={info.certificate}
              eligible={info.certificateEligible}
              passed={info.passed}
              missing={info.missions.missing}
              onClaim={() => claim.mutate()}
              claiming={claim.isPending}
            />
          ) : null}

          {info.attempts.length > 0 ? (
            <section className="mt-8">
              <h2 className="font-sans text-heading-sm text-ase-text">{c.attempts}</h2>
              <div className="mt-3 overflow-x-auto rounded-ase-xl border border-ase-border">
                <table className="w-full min-w-[520px] text-body-sm">
                  <thead className="bg-ase-bg2 text-left text-caption uppercase tracking-wide text-ase-muted">
                    <tr>
                      <th className="px-4 py-2">{c.thDate}</th>
                      <th className="px-4 py-2">{c.thScore}</th>
                      <th className="px-4 py-2">{c.thResult}</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ase-border">
                    {info.attempts.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-2 text-ase-text2">{DATE_FMT[lang].format(new Date(a.startedAt))}</td>
                        <td className="px-4 py-2 tabular-nums text-ase-text">{a.score == null ? '—' : `${a.score}/${a.total}`}</td>
                        <td className="px-4 py-2">
                          {a.inProgress ? (
                            <span className="text-ase-brand">{c.inCourse}</span>
                          ) : a.passed ? (
                            <span className="inline-flex items-center gap-1 text-ase-success">
                              <Check className="h-3.5 w-3.5" aria-hidden /> {c.passed}
                            </span>
                          ) : (
                            <span className="text-ase-warning">
                              {c.notPassed}
                              {a.timedOut ? c.timedOut : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button type="button" onClick={() => setParams({ intento: a.id })} className="text-ase-brand hover:underline">
                            {a.inProgress ? c.continue : c.viewReport}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      )}

      <p className="mt-10 text-caption text-ase-muted">
        {c.disclaimer}
      </p>
    </div>
  )
}

function FormatCards({ info, copy: t }: { info: ExamOverview; copy: (typeof COPY)['es']['cards'] }) {
  const c = info.config
  const cards = [
    { icon: FileQuestion, label: t.questions, value: `${c.total}`, hint: t.questionsHint },
    { icon: Clock, label: t.time, value: `${c.minutes} min`, hint: t.timeHint(c.extendedMinutes) },
    { icon: Target, label: t.toPass, value: t.toPassValue(c.passMark), hint: `${Math.round((100 * c.passMark) / c.total)} %` },
    { icon: Award, label: t.best, value: info.bestScore == null ? '—' : `${info.bestScore}/${c.total}`, hint: t.bestHint(c.distinctExams) },
  ]
  return (
    <section className="mt-8 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, hint }) => (
          <div key={label} className="rounded-ase-lg border border-ase-border bg-ase-bg2 p-4">
            <p className="flex items-center gap-2 text-caption text-ase-muted">
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </p>
            <p className="mt-1 font-display text-heading-sm text-ase-text">{value}</p>
            <p className="text-caption text-ase-muted">{hint}</p>
          </div>
        ))}
      </div>
      <div className="rounded-ase-lg border border-ase-border bg-ase-bg2 p-4">
        <p className="text-body-sm font-semibold text-ase-text">{t.distribution}</p>
        <ul className="mt-2 grid gap-x-6 gap-y-1 text-body-sm text-ase-text2 sm:grid-cols-2">
          {c.distribution.map((d) => (
            <li key={d.chapter} className="flex justify-between gap-3">
              <span>
                {d.chapter}. {d.title}
              </span>
              <span className="tabular-nums text-ase-text">{d.count}</span>
            </li>
          ))}
        </ul>
        {info.authenticated ? (
          <p className="mt-3 text-caption text-ase-muted">
            {t.finished(info.missions.finished, info.missions.total)}
          </p>
        ) : null}
      </div>
    </section>
  )
}
