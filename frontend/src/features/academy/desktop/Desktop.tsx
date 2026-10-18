import { useEffect, useState } from 'react'
import { BookOpen, ClipboardList, Clock, FastForward, FileSearch, GraduationCap, Landmark, ListChecks, Lock, LogOut, Mail, MessageSquare, Terminal } from 'lucide-react'
import { Link } from 'react-router-dom'
import { APP_COMPONENTS, DEFAULT_APP } from '../apps/registry'
import { clockLabel, evaluate, pendingMeeting, toolStatus } from '../engine/engine'
import type { Message, RunState, ToolId } from '../engine/types'
import type { SyncStatus } from '../useMissionRun'
import { ChatTool } from '../tools/ChatTool'
import { DesignTool } from '../tools/DesignTool'
import { ReviewTool } from '../tools/ReviewTool'
import { MentorPanel } from './MentorPanel'
import { LogsTool } from '../tools/LogsTool'
import { MailTool } from '../tools/MailTool'
import { TicketsTool } from '../tools/TicketsTool'
import type { ToolProps } from '../tools/types'
import { WikiTool } from '../tools/WikiTool'
import { Avatar, RichText } from '../ui'
import { npcOf } from '../uiHelpers'
import { missionLang, type AcademyLang } from '../i18n'

const TOOL_ICON: Record<ToolId, typeof Mail> = {
  mail: Mail,
  chat: MessageSquare,
  tickets: ClipboardList,
  review: FileSearch,
  design: ListChecks,
  wiki: BookOpen,
  app: Landmark,
  logs: Terminal,
}

const TOOL_LABEL: Record<AcademyLang, Record<ToolId, string>> = {
  es: { mail: 'Correo', chat: 'Chat', tickets: 'Tablero', review: 'Revisión', design: 'Diseño', wiki: 'Wiki', app: 'Staging', logs: 'Logs' },
  en: { mail: 'Mail', chat: 'Chat', tickets: 'Board', review: 'Review', design: 'Design', wiki: 'Wiki', app: 'Staging', logs: 'Logs' },
}

const COPY = {
  es: {
    exit: 'Salir (la partida se guarda)',
    ask: (name: string) => `Pregúntale a ${name}`,
    wait: 'Esperar 30 min',
    confirmEnd: (time: string) => `¿Terminar la jornada e ir a la reunión de las ${time}?`,
    endDay: 'Terminar el día',
    newMail: 'Nuevo correo',
    newMessage: 'Nuevo mensaje',
    meeting: 'Reunión',
  },
  en: {
    exit: 'Exit (your game is saved)',
    ask: (name: string) => `Ask ${name}`,
    wait: 'Wait 30 min',
    confirmEnd: (time: string) => `End the day and go to the ${time} wrap-up meeting?`,
    endDay: 'End the day',
    newMail: 'New email',
    newMessage: 'New message',
    meeting: 'Meeting',
  },
}

const channelTool: Record<Message['channel'], ToolId> = { email: 'mail', chat: 'chat', meeting: 'chat' }

const SYNC_CLS: Record<SyncStatus, string> = {
  saved: 'text-ase-success',
  saving: 'text-ase-muted',
  loading: 'text-ase-muted',
  error: 'text-ase-warning',
  local: 'text-ase-muted',
}

const SYNC_TEXT: Record<AcademyLang, Record<SyncStatus, string>> = {
  es: {
    saved: 'Progreso guardado',
    saving: 'Guardando…',
    loading: 'Cargando…',
    error: 'Sin conexión: guardado solo en este navegador',
    local: 'Inicia sesión para guardar tu progreso en tu cuenta',
  },
  en: {
    saved: 'Progress saved',
    saving: 'Saving…',
    loading: 'Loading…',
    error: 'Offline: saved in this browser only',
    local: 'Sign in to save your progress to your account',
  },
}

export function Desktop({ sync, ...props }: ToolProps & { stateRef: React.RefObject<RunState>; backTo: string; sync: SyncStatus }) {
  const { mission, state, dispatch } = props
  const lang = missionLang(mission)
  const c = COPY[lang]
  const [tool, setTool] = useState<ToolId>('mail')
  const [mentorOpen, setMentorOpen] = useState(false)
  // Datos que la herramienta de diseño precarga en la app bajo prueba.
  const [prefill, setPrefill] = useState<{ nonce: number; values: Record<string, string> } | null>(null)
  const latest = [...state.messages].reverse().find((m) => m.channel !== 'meeting')
  // Mensajes con id <= dismissed no se notifican (incluye los que ya había al cargar).
  const [dismissed, setDismissed] = useState(() => latest?.id ?? 0)
  const toast = latest && latest.id > dismissed ? latest : null
  const meeting = pendingMeeting(state)

  // Notificación tipo "toast" para mensajes nuevos; se oculta sola a los 5 s.
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setDismissed(toast.id), 5000)
    return () => window.clearTimeout(t)
  }, [toast])

  const unread = (t: ToolId) => state.messages.filter((m) => !m.read && channelTool[m.channel] === t && m.channel !== 'meeting').length
  const progress = Math.round((state.clock / mission.duration) * 100)
  const rule = mission.tools.find((t) => t.tool === tool)
  const status = toolStatus(mission, state, tool)
  const AppUnderTest = APP_COMPONENTS[mission.appId ?? DEFAULT_APP] ?? APP_COMPONENTS[DEFAULT_APP]

  return (
    <div className="flex h-dvh flex-col bg-ase-bg text-ase-text">
      {/* Barra superior */}
      <header className="flex flex-wrap items-center gap-3 border-b border-ase-border bg-ase-bg2 px-4 py-2">
        <Link to={props.backTo} className="text-caption text-ase-muted hover:text-ase-text" title={c.exit}>
          <LogOut className="h-4 w-4" />
        </Link>
        <span className="font-display text-body-lg font-semibold">{mission.world.company}</span>
        <span className="hidden text-caption text-ase-muted sm:inline">
          {mission.playerRole} · {mission.title}
        </span>
        <span className={`hidden text-caption lg:inline ${SYNC_CLS[sync]}`} role="status">
          {SYNC_TEXT[lang][sync]}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-data-md">
            <Clock className="h-4 w-4 text-ase-brand" />
            {mission.dayLabel} · {clockLabel(mission, state.clock)}
          </span>
          <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-white/10 sm:block" aria-hidden>
            <div className="h-full bg-ase-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
          {(mission.lessons?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => setMentorOpen(true)}
              disabled={!!meeting || state.finished}
              className="flex items-center gap-1 rounded-ase-md border border-ase-brand/50 px-2.5 py-1 text-caption text-ase-text hover:bg-ase-brand/10 disabled:opacity-40"
            >
              <GraduationCap className="h-3.5 w-3.5" /> {c.ask(npcOf(mission, mission.mentor ?? mission.reportReviewer).name.split(' ')[0])}
            </button>
          )}
          <button
            type="button"
            onClick={() => dispatch({ type: 'wait', minutes: 30 })}
            disabled={!!meeting || state.finished}
            className="rounded-ase-md border border-ase-border px-2.5 py-1 text-caption text-ase-text2 hover:border-ase-brand disabled:opacity-40"
          >
            {c.wait}
          </button>
          <button
            type="button"
            onClick={() => {
              const end = mission.dayStart + mission.duration
              const time = `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`
              if (window.confirm(c.confirmEnd(time))) dispatch({ type: 'endDay' })
            }}
            disabled={!!meeting || state.finished}
            className="flex items-center gap-1 rounded-ase-md bg-ase-surfaceSoft px-2.5 py-1 text-caption text-ase-text hover:bg-ase-brand/20 disabled:opacity-40"
          >
            <FastForward className="h-3.5 w-3.5" /> {c.endDay}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        {/* Dock de herramientas */}
        <nav className="flex shrink-0 justify-around border-t border-ase-border bg-ase-bg2 md:flex-col md:justify-start md:gap-1 md:border-r md:border-t-0 md:p-2">
          {mission.tools.map(({ tool: id }) => {
            const label = id === 'app' && mission.appLabel ? mission.appLabel : TOOL_LABEL[lang][id]
            const Icon = TOOL_ICON[id]
            const n = unread(id)
            const locked = toolStatus(mission, state, id) === 'locked'
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTool(id)}
                className={`relative flex flex-col items-center gap-0.5 rounded-ase-md px-3 py-2 text-[10px] transition md:w-16 ${
                  tool === id ? 'bg-ase-brand/15 text-ase-text' : 'text-ase-muted hover:bg-white/5 hover:text-ase-text'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
                {locked && <Lock className="absolute right-1.5 top-1.5 h-3 w-3" />}
                {n > 0 && (
                  <span className="absolute right-1 top-1 min-w-4 rounded-full bg-ase-brand px-1 text-[10px] font-semibold text-white">{n}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Herramienta activa */}
        <main className="relative min-h-0 flex-1 overflow-hidden bg-ase-surface">
          {status === 'locked' && rule ? (
            <div className="flex h-full items-center justify-center p-6">
              <div className="max-w-md space-y-4 rounded-ase-xl border border-ase-border bg-ase-bg2 p-6 text-center">
                <Lock className="mx-auto h-8 w-8 text-ase-muted" />
                <p className="text-body-sm text-ase-text2">{rule.lockedMessage}</p>
                {rule.unlockAction && (
                  <button
                    type="button"
                    disabled={state.finished}
                    onClick={() => dispatch({ type: 'unlockTool', tool })}
                    className="rounded-ase-md bg-ase-brand px-4 py-2 text-body-sm font-semibold text-white hover:bg-ase-brand-strong"
                  >
                    {rule.unlockAction.label}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {tool === 'mail' && <MailTool {...props} />}
              {tool === 'chat' && <ChatTool {...props} />}
              {tool === 'tickets' && <TicketsTool {...props} />}
              {tool === 'review' && <ReviewTool {...props} />}
              {tool === 'design' && (
                <DesignTool
                  {...props}
                  onRun={(values) => {
                    setPrefill((p) => ({ nonce: (p?.nonce ?? 0) + 1, values }))
                    setTool('app')
                  }}
                />
              )}
              {tool === 'wiki' && <WikiTool {...props} />}
              {tool === 'app' && <AppUnderTest key={prefill?.nonce ?? 0} {...props} initialForm={prefill?.values} />}
              {tool === 'logs' && <LogsTool {...props} />}
            </>
          )}

          {toast && !meeting && (
            <button
              type="button"
              onClick={() => {
                setTool(channelTool[toast.channel])
                setDismissed(toast.id)
              }}
              className="absolute bottom-4 right-4 flex max-w-sm gap-3 rounded-ase-lg border border-ase-border bg-ase-bg2 p-3 text-left shadow-soft"
            >
              <Avatar npc={npcOf(mission, toast.from)} size="sm" />
              <span className="min-w-0">
                <span className="block text-caption text-ase-muted">
                  {toast.channel === 'email' ? c.newMail : c.newMessage} · {npcOf(mission, toast.from).name}
                </span>
                <span className="line-clamp-2 text-body-sm text-ase-text">{toast.subject ?? toast.body.replace(/\*\*/g, '').replace(/\s*\n+\s*-?\s*/g, ' · ')}</span>
              </span>
            </button>
          )}
        </main>
      </div>

      {mentorOpen && !meeting && <MentorPanel {...props} onClose={() => setMentorOpen(false)} />}
      {meeting && <MeetingModal {...props} meeting={meeting} />}
    </div>
  )
}

function MeetingModal({ mission, state, dispatch, meeting }: ToolProps & { meeting: Message }) {
  const scene = mission.scenes.find((s) => s.id === meeting.sceneId)
  const people = [meeting.from, ...(meeting.with ?? [])].map((id) => npcOf(mission, id))
  const options = (scene?.choices ?? []).filter((c) => evaluate(mission, state, c.requires))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal aria-labelledby="meeting-title">
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-ase-xl border border-ase-border bg-ase-bg2 p-6 shadow-soft">
        <p className="text-label uppercase text-ase-brand">
          {COPY[missionLang(mission)].meeting} · {clockLabel(mission, meeting.at)}
        </p>
        <h2 id="meeting-title" className="mb-3 font-sans text-heading-sm font-semibold">
          {meeting.subject}
        </h2>
        <div className="mb-4 flex -space-x-2">
          {people.map((p) => (
            <span key={p.id} title={`${p.name} · ${p.role}`} className="rounded-full ring-2 ring-ase-bg2">
              <Avatar npc={p} />
            </span>
          ))}
        </div>
        <RichText text={meeting.body} className="mb-5" />
        <div className="space-y-2">
          {options.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => dispatch({ type: 'choose', messageId: meeting.id, choiceId: c.id })}
              className="block w-full rounded-ase-md border border-ase-border bg-ase-surface px-4 py-3 text-left text-body-sm text-ase-text transition hover:border-ase-brand hover:bg-ase-brand/10"
            >
              {c.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
