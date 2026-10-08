import { useState } from 'react'
import { X } from 'lucide-react'
import type { ToolProps } from '../tools/types'
import { Avatar, RichText } from '../ui'
import { npcOf } from '../uiHelpers'

/** «Pregúntale a Laura»: microlecciones en contexto con coste de tiempo. */
export function MentorPanel({ mission, state, dispatch, onClose }: ToolProps & { onClose: () => void }) {
  const lessons = mission.lessons ?? []
  const mentor = npcOf(mission, mission.mentor ?? mission.reportReviewer)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = lessons.find((l) => l.id === openId)
  const read = open ? state.lessonsRead.includes(open.id) : false

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" role="dialog" aria-modal aria-label={`Pregúntale a ${mentor.name}`} onClick={onClose}>
      <aside className="flex h-full w-full max-w-lg flex-col border-l border-ase-border bg-ase-bg2 shadow-soft" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center gap-3 border-b border-ase-border p-4">
          <Avatar npc={mentor} />
          <div className="min-w-0 flex-1">
            <p className="font-sans text-body-md font-semibold">Pregúntale a {mentor.name.split(' ')[0]}</p>
            <p className="text-caption text-ase-muted">Cada consulta nueva te lleva unos minutos de jornada.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded p-1 text-ase-muted hover:text-ase-text">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {!open ? (
            <ul className="space-y-2">
              {lessons.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(l.id)}
                    className="flex w-full items-center justify-between gap-3 rounded-ase-md border border-ase-border bg-ase-surface px-4 py-3 text-left text-body-sm text-ase-text hover:border-ase-brand"
                  >
                    <span>{l.question}</span>
                    <span className="shrink-0 text-caption text-ase-muted">
                      {state.lessonsRead.includes(l.id) ? 'Consultada' : `${l.cost} min`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <article className="space-y-4">
              <button type="button" onClick={() => setOpenId(null)} className="text-caption text-ase-brand hover:underline">
                ← Otras preguntas
              </button>
              <h3 className="font-sans text-body-lg font-semibold">{open.question}</h3>
              {read ? (
                <RichText text={open.body} />
              ) : (
                <div className="rounded-ase-lg border border-dashed border-ase-border p-5 text-center">
                  <p className="mb-3 text-body-sm text-ase-text2">
                    {mentor.name.split(' ')[0]} te lo explica en unos {open.cost} minutos.
                  </p>
                  <button
                    type="button"
                    disabled={state.finished}
                    onClick={() => dispatch({ type: 'askMentor', lessonId: open.id })}
                    className="rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong disabled:opacity-40"
                  >
                    Preguntar · {open.cost} min
                  </button>
                </div>
              )}
            </article>
          )}
        </div>
      </aside>
    </div>
  )
}
