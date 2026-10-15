import type { Action, Mission, QuizPhase, RunState } from './engine/types'
import { quizScore } from './engine/engine'
import { missionLang } from './i18n'

const COPY = {
  es: {
    preKicker: 'Antes de empezar · diagnóstico',
    postKicker: 'Antes de ver tu resultado · comprobación',
    preTitle: '¿Qué sabes ya?',
    postTitle: '¿Qué has aprendido?',
    preIntro: (n: number) => `${n} preguntas rápidas. No cuentan para la nota: sirven para medir cuánto aprendes en la misión.`,
    postIntro: (n: number) => `${n} preguntas sobre los mismos conceptos, en otras situaciones. Compararemos con tu diagnóstico.`,
    question: (n: number) => `Pregunta ${n}`,
    start: 'Empezar la jornada',
    results: 'Ver mis resultados',
    answered: (a: number, t: number) => `${a} de ${t} respondidas`,
  },
  en: {
    preKicker: 'Before you start · diagnostic',
    postKicker: 'Before seeing your result · check',
    preTitle: 'What do you already know?',
    postTitle: 'What have you learned?',
    preIntro: (n: number) => `${n} quick questions. They don't count toward your grade: they measure how much you learn in the mission.`,
    postIntro: (n: number) => `${n} questions on the same concepts, in different situations. We'll compare them with your diagnostic.`,
    question: (n: number) => `Question ${n}`,
    start: 'Start the day',
    results: 'See my results',
    answered: (a: number, t: number) => `${a} of ${t} answered`,
  },
}

/** Diagnóstico (antes) o comprobación (después). Sin correcciones aquí: se ven en el debrief. */
export function QuizScreen({
  mission,
  state,
  dispatch,
  phase,
  onContinue,
}: {
  mission: Mission
  state: RunState
  dispatch: (a: Action) => void
  phase: QuizPhase
  onContinue: () => void
}) {
  const questions = mission.quiz?.[phase] ?? []
  const answers = state.quizAnswers[phase]
  const sc = quizScore(mission, state, phase)
  const done = sc.answered === sc.total
  const c = COPY[missionLang(mission)]

  return (
    <div className="min-h-dvh bg-ase-bg px-4 py-10 text-ase-text">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-label uppercase text-ase-brand">
            {phase === 'pre' ? c.preKicker : c.postKicker}
          </p>
          <h1 className="font-display text-heading-xl">{phase === 'pre' ? c.preTitle : c.postTitle}</h1>
          <p className="text-body-md text-ase-text2">
            {phase === 'pre' ? c.preIntro(sc.total) : c.postIntro(sc.total)}
          </p>
        </header>
        <ol className="space-y-5">
          {questions.map((q, n) => (
            <li key={q.id} className="rounded-ase-lg border border-ase-border bg-ase-surface p-4">
              <p className="mb-3 text-body-md text-ase-text">
                {n + 1}. {q.question}
              </p>
              <div className="space-y-2" role="radiogroup" aria-label={c.question(n + 1)}>
                {q.options.map((opt, i) => {
                  const chosen = answers[q.id] === i
                  const locked = answers[q.id] !== undefined
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={chosen}
                      disabled={locked}
                      onClick={() => dispatch({ type: 'quizAnswer', phase, questionId: q.id, option: i })}
                      className={`block w-full rounded-ase-md border px-3 py-2 text-left text-body-sm transition ${
                        chosen ? 'border-ase-brand bg-ase-brand/20 text-ase-text' : 'border-ase-border text-ase-text2'
                      } ${locked && !chosen ? 'opacity-50' : 'hover:border-ase-brand'}`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            </li>
          ))}
        </ol>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!done}
            onClick={onContinue}
            className="rounded-ase-md bg-ase-brand px-5 py-2.5 font-semibold text-white hover:bg-ase-brand-strong disabled:opacity-40"
          >
            {phase === 'pre' ? c.start : c.results}
          </button>
          <span className="text-caption text-ase-muted">
            {c.answered(sc.answered, sc.total)}
          </span>
        </div>
      </div>
    </div>
  )
}
