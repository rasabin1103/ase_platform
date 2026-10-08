import type { Action, Mission, QuizPhase, RunState } from './engine/types'
import { quizScore } from './engine/engine'

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

  return (
    <div className="min-h-dvh bg-ase-bg px-4 py-10 text-ase-text">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-label uppercase text-ase-brand">
            {phase === 'pre' ? 'Antes de empezar · diagnóstico' : 'Antes de ver tu resultado · comprobación'}
          </p>
          <h1 className="font-display text-heading-xl">{phase === 'pre' ? '¿Qué sabes ya?' : '¿Qué has aprendido?'}</h1>
          <p className="text-body-md text-ase-text2">
            {phase === 'pre'
              ? `${sc.total} preguntas rápidas. No cuentan para la nota: sirven para medir cuánto aprendes en la misión.`
              : `${sc.total} preguntas sobre los mismos conceptos, en otras situaciones. Compararemos con tu diagnóstico.`}
          </p>
        </header>
        <ol className="space-y-5">
          {questions.map((q, n) => (
            <li key={q.id} className="rounded-ase-lg border border-ase-border bg-ase-surface p-4">
              <p className="mb-3 text-body-md text-ase-text">
                {n + 1}. {q.question}
              </p>
              <div className="space-y-2" role="radiogroup" aria-label={`Pregunta ${n + 1}`}>
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
            {phase === 'pre' ? 'Empezar la jornada' : 'Ver mis resultados'}
          </button>
          <span className="text-caption text-ase-muted">
            {sc.answered} de {sc.total} respondidas
          </span>
        </div>
      </div>
    </div>
  )
}
