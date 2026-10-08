import { useState } from 'react'
import { clockLabel } from '../engine/engine'
import { Avatar, RichText } from '../ui'
import { npcOf } from '../uiHelpers'
import type { ToolProps } from './types'

export function MailTool({ mission, state, dispatch }: ToolProps) {
  const mails = state.messages.filter((m) => m.channel === 'email').slice().reverse()
  const [openId, setOpenId] = useState<number | null>(mails[0]?.id ?? null)
  const open = mails.find((m) => m.id === openId)

  return (
    <div className="grid h-full min-h-0 md:grid-cols-[18rem_1fr]">
      <ul className="min-h-0 overflow-y-auto border-b border-ase-border md:border-b-0 md:border-r">
        {mails.map((m) => {
          const npc = npcOf(mission, m.from)
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  setOpenId(m.id)
                  if (!m.read) dispatch({ type: 'read', messageId: m.id })
                }}
                className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-white/5 ${
                  m.id === openId ? 'bg-white/5' : ''
                }`}
              >
                <Avatar npc={npc} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-caption text-ase-muted">
                    <span className={m.read ? '' : 'font-semibold text-ase-text'}>{npc.name}</span>
                    <span>{clockLabel(mission, m.at)}</span>
                  </span>
                  <span className={`block truncate text-body-sm ${m.read ? 'text-ase-text2' : 'font-semibold text-ase-text'}`}>
                    {m.subject}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        {mails.length === 0 && <li className="p-4 text-body-sm text-ase-muted">Bandeja vacía.</li>}
      </ul>
      <div className="min-h-0 overflow-y-auto p-5">
        {open ? (
          <article className="mx-auto max-w-2xl">
            <h2 className="font-sans text-heading-sm font-semibold">{open.subject}</h2>
            <p className="mb-4 mt-1 text-caption text-ase-muted">
              De {npcOf(mission, open.from).name} · {clockLabel(mission, open.at)}
            </p>
            <RichText text={open.body} />
          </article>
        ) : (
          <p className="text-body-sm text-ase-muted">Selecciona un correo.</p>
        )}
      </div>
    </div>
  )
}
