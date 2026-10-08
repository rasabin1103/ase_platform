import { useState } from 'react'
import { Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Debrief } from './debrief/Debrief'
import { Desktop } from './desktop/Desktop'
import type { Mission } from './engine/types'
import { quizPending } from './engine/engine'
import { QuizScreen } from './QuizScreen'
import { useMissionRun } from './useMissionRun'
import { RouteLoadingFallback } from '../../components/layout/RouteLoadingFallback'

export function MissionPlayer({ mission }: { mission: Mission }) {
  const { state, stateRef, dispatch, restart, sync } = useMissionRun(mission)
  const backTo = `/academy/${mission.courseKey}`
  const [preOpen, setPreOpen] = useState(false)
  // Si al cargar la comprobación ya estaba hecha, no se vuelve a mostrar.
  const [postSeen, setPostSeen] = useState(() => !quizPending(mission, state, 'post'))

  if (sync === 'loading') return <RouteLoadingFallback />

  if (state.finished) {
    if (!postSeen && (mission.quiz?.post.length ?? 0) > 0) {
      return <QuizScreen mission={mission} state={state} dispatch={dispatch} phase="post" onContinue={() => setPostSeen(true)} />
    }
    return (
      <Debrief
        mission={mission}
        state={state}
        onRestart={() => {
          setPostSeen(false)
          restart()
        }}
        backTo={backTo}
      />
    )
  }

  if (!state.started && preOpen) {
    return <QuizScreen mission={mission} state={state} dispatch={dispatch} phase="pre" onContinue={() => dispatch({ type: 'start' })} />
  }

  if (!state.started) {
    const b = mission.briefing
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ase-bg px-4 py-10 text-ase-text">
        <div className="w-full max-w-2xl space-y-6 rounded-ase-xl border border-ase-border bg-ase-surface p-6 shadow-soft sm:p-8">
          <p className="text-label uppercase text-ase-brand">
            {mission.world.company} · {mission.world.sector} · Misión {mission.number}
          </p>
          <h1 className="font-display text-heading-xl">{b.title}</h1>
          <div className="space-y-3 text-body-md text-ase-text2">
            {b.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div>
            <h2 className="mb-2 text-label uppercase text-ase-muted">Objetivos del día</h2>
            <ul className="ml-5 list-disc space-y-1 text-body-sm text-ase-text2">
              {b.goals.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => (quizPending(mission, state, 'pre') ? setPreOpen(true) : dispatch({ type: 'start' }))}
              className="flex items-center gap-2 rounded-ase-md bg-ase-brand px-5 py-2.5 font-semibold text-white hover:bg-ase-brand-strong"
            >
              <Play className="h-4 w-4" /> {quizPending(mission, state, 'pre') ? 'Hacer el diagnóstico (2 min)' : 'Empezar la jornada'}
            </button>
            <Link to={backTo} className="text-body-sm text-ase-muted hover:text-ase-text">
              Volver
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <Desktop mission={mission} state={state} stateRef={stateRef} dispatch={dispatch} backTo={backTo} sync={sync} />
}
