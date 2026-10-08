import { useEffect, useMemo, useRef, useState } from 'react'
import { clockLabel, evaluate } from '../engine/engine'
import type { Message } from '../engine/types'
import { Avatar, RichText } from '../ui'
import { npcOf } from '../uiHelpers'
import type { ToolProps } from './types'

export function ChatTool({ mission, state, dispatch }: ToolProps) {
  const conversations = useMemo(() => {
    const byNpc = new Map<string, Message[]>()
    for (const m of state.messages) if (m.channel === 'chat') byNpc.set(m.from, [...(byNpc.get(m.from) ?? []), m])
    return Array.from(byNpc.entries()).sort((a, b) => b[1].at(-1)!.id - a[1].at(-1)!.id)
  }, [state.messages])
  const [active, setActive] = useState<string | null>(null)
  const current = active ?? conversations[0]?.[0] ?? null
  const thread = useMemo(() => conversations.find(([id]) => id === current)?.[1] ?? [], [conversations, current])
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Se marcan como leídos salvo los que esperan respuesta (siguen con aviso).
    for (const m of thread) {
      const awaiting = !m.chosen && !!mission.scenes.find((s) => s.id === m.sceneId)?.choices
      if (!m.read && !awaiting) dispatch({ type: 'read', messageId: m.id })
    }
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [thread, dispatch, mission])

  return (
    <div className="grid h-full min-h-0 md:grid-cols-[16rem_1fr]">
      <ul className="flex min-h-0 overflow-x-auto border-b border-ase-border md:block md:overflow-y-auto md:border-b-0 md:border-r">
        {conversations.map(([npcId, msgs]) => {
          const npc = npcOf(mission, npcId)
          const unread = msgs.filter((m) => !m.read).length
          return (
            <li key={npcId} className="shrink-0">
              <button
                type="button"
                onClick={() => setActive(npcId)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${
                  npcId === current ? 'bg-white/5' : ''
                }`}
              >
                <Avatar npc={npc} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body-sm font-medium text-ase-text">{npc.name}</span>
                  <span className="hidden truncate text-caption text-ase-muted md:block">{npc.role}</span>
                </span>
                {unread > 0 && (
                  <span className="rounded-full bg-ase-brand px-1.5 text-caption font-semibold text-white">{unread}</span>
                )}
              </button>
            </li>
          )
        })}
        {conversations.length === 0 && <li className="p-4 text-body-sm text-ase-muted">Sin conversaciones.</li>}
      </ul>

      <div className="flex min-h-0 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          {thread.map((m) => {
            const npc = npcOf(mission, m.from)
            const scene = mission.scenes.find((s) => s.id === m.sceneId)
            const chosen = scene?.choices?.find((c) => c.id === m.chosen)
            const options = !m.chosen && !state.finished ? (scene?.choices ?? []).filter((c) => evaluate(mission, state, c.requires)) : []
            return (
              <div key={m.id} className="space-y-3">
                <div className="flex gap-3">
                  <Avatar npc={npc} size="sm" />
                  <div className="max-w-xl rounded-ase-lg rounded-tl-none bg-ase-surfaceSoft px-4 py-3">
                    <p className="mb-1 text-caption text-ase-muted">
                      {npc.name} · {clockLabel(mission, m.at)}
                    </p>
                    <RichText text={m.body} />
                  </div>
                </div>
                {chosen && (
                  <div className="flex justify-end">
                    <div className="max-w-xl rounded-ase-lg rounded-tr-none bg-ase-brand/20 px-4 py-3 text-body-sm text-ase-text">
                      {chosen.text}
                    </div>
                  </div>
                )}
                {m.replies.map((r, i) => {
                  const rn = npcOf(mission, r.from)
                  return (
                    <div key={i} className="flex gap-3">
                      <Avatar npc={rn} size="sm" />
                      <div className="max-w-xl rounded-ase-lg rounded-tl-none bg-ase-surfaceSoft px-4 py-3">
                        <RichText text={r.body} />
                      </div>
                    </div>
                  )
                })}
                {options.length > 0 && (
                  <div className="ml-10 space-y-2 border-l-2 border-ase-brand/40 pl-4">
                    <p className="text-label uppercase text-ase-muted">Responder</p>
                    {options.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => dispatch({ type: 'choose', messageId: m.id, choiceId: c.id })}
                        className="block w-full rounded-ase-md border border-ase-border bg-ase-surface px-4 py-2.5 text-left text-body-sm text-ase-text transition hover:border-ase-brand hover:bg-ase-brand/10"
                      >
                        {c.text}
                        {c.cost ? <span className="ml-2 text-caption text-ase-muted">· {c.cost} min</span> : null}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <div ref={bottom} />
        </div>
      </div>
    </div>
  )
}
