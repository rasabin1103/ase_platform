import { useState } from 'react'
import { evaluate } from '../engine/engine'
import { RichText } from '../ui'
import type { ToolProps } from './types'

export function WikiTool({ mission, state, dispatch }: ToolProps) {
  const docs = mission.docs.filter((d) => evaluate(mission, state, d.visibleWhen))
  const [openId, setOpenId] = useState(docs[0]?.id)
  const doc = docs.find((d) => d.id === openId)
  const read = doc ? state.docsRead.includes(doc.id) : false

  return (
    <div className="grid h-full min-h-0 md:grid-cols-[18rem_1fr]">
      <ul className="min-h-0 overflow-y-auto border-b border-ase-border p-3 md:border-b-0 md:border-r">
        <li className="px-1 pb-2 text-label uppercase text-ase-muted">Wiki · Equipo de Pagos</li>
        {docs.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => setOpenId(d.id)}
              className={`mb-1 w-full rounded-ase-md px-3 py-2 text-left transition hover:bg-white/5 ${d.id === openId ? 'bg-white/5' : ''}`}
            >
              <span className="block text-body-sm text-ase-text">{d.title}</span>
              <span className="text-caption text-ase-muted">{state.docsRead.includes(d.id) ? 'Leído' : `Lectura: ${d.readCost} min`}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="min-h-0 overflow-y-auto p-5">
        {doc && (
          <article className="mx-auto max-w-2xl">
            <h2 className="font-sans text-heading-sm font-semibold">{doc.title}</h2>
            <p className="mb-4 mt-1 text-caption text-ase-muted">{doc.updatedLabel}</p>
            {read ? (
              <RichText text={doc.body} />
            ) : (
              <div className="rounded-ase-lg border border-dashed border-ase-border p-6 text-center">
                <p className="mb-3 text-body-sm text-ase-text2">Leer este documento con atención te llevará unos {doc.readCost} minutos.</p>
                <button
                  type="button"
                  disabled={state.finished}
                  onClick={() => dispatch({ type: 'readDoc', docId: doc.id })}
                  className="rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white transition hover:bg-ase-brand-strong disabled:opacity-40"
                >
                  Leer · {doc.readCost} min
                </button>
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  )
}
