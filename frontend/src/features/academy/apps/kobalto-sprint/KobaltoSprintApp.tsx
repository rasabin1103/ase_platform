import { useState } from 'react'
import type { AppEvent, RunState } from '../../engine/types'
import { missionLang, tr, type AcademyLang } from '../../i18n'
import type { ToolProps } from '../../tools/types'
import {
  DAY_CAPACITY,
  INITIAL_SPRINT,
  MAX_AGREEMENTS,
  agreementsFor,
  analyzeFlow,
  flowFacts,
  propose,
  storiesFor,
  testPlan,
  toggleAgreement,
  togglePlan,
  type SprintState,
} from './sprintLogic'

type Send = (r: { state: SprintState; event: AppEvent }) => void
type Props = ToolProps & { stateRef: React.RefObject<RunState>; initialForm?: Record<string, string> }
type Tab = 'board' | 'flow' | 'retro'
type ViewProps = { app: SprintState; send: Send; locked: boolean; lang: AcademyLang }

/** Tablero del sprint 14 del squad Tarjetas (curso 4, misión 1). */
export function KobaltoSprintApp({ dispatch, state, mission }: Props) {
  const lang = missionLang(mission)
  const t = (es: string, en: string) => tr(lang, es, en)
  const app = (state.appState['kobalto-sprint'] as SprintState | undefined) ?? INITIAL_SPRINT
  const [tab, setTab] = useState<Tab>('board')
  const send: Send = (r) => dispatch({ type: 'app', event: { ...r.event, state: r.state } })
  const locked = state.finished

  const tabs: { id: Tab; label: string }[] = [
    { id: 'board', label: t('Tablero', 'Board') },
    { id: 'flow', label: t('Flujo del sprint', 'Sprint flow') },
    { id: 'retro', label: t('Propuestas para la retro', 'Retro proposals') },
  ]

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-slate-100 text-slate-900">
      <div className="flex items-center justify-between bg-slate-900 px-4 py-1 font-mono text-[11px] text-amber-300">
        <span>{t('Sprint 14 · squad Tarjetas · día 9 de 10', 'Sprint 14 · Cards squad · day 9 of 10')}</span>
        <span>{t('Retro: 16:00 · cierre: mañana', 'Retro: 4:00 PM · close: tomorrow')}</span>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 p-5">
        <div className="flex flex-wrap gap-2 text-sm" role="tablist" aria-label={t('Secciones', 'Sections')}>
          {tabs.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={tab === x.id}
              onClick={() => setTab(x.id)}
              className={`rounded-full px-4 py-1.5 font-medium ${tab === x.id ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600'}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        {tab === 'board' && <BoardView app={app} send={send} locked={locked} lang={lang} />}
        {tab === 'flow' && <FlowView app={app} send={send} locked={locked} lang={lang} />}
        {tab === 'retro' && <RetroView app={app} send={send} locked={locked} lang={lang} />}
      </div>
    </div>
  )
}

function BoardView({ app, send, locked, lang }: ViewProps) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const stories = storiesFor(lang)
  const done = stories.filter((s) => s.column === 'done')
  const queue = stories.filter((s) => s.column === 'qa_ready')
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        {t('Hoy te da tiempo a probar ', 'Today you have time to test ')}
        <strong>{DAY_CAPACITY} {t('historias', 'stories')}</strong>
        {t(` de las ${queue.length} que esperan. Elige cuáles y pruébalas.`, ` of the ${queue.length} waiting. Choose which ones and test them.`)}
      </p>
      <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h4 className="font-sans font-semibold text-slate-800">{t('Hecho', 'Done')} ({done.length})</h4>
          <ul className="mt-2 space-y-2">
            {done.map((s) => (
              <li key={s.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <span className="font-mono text-xs text-emerald-700">{s.id}</span> · {s.title}
                <p className="text-xs text-slate-500">
                  {t(`Llegó a QA el día ${s.qaDay} · ${s.points} puntos`, `Reached QA on day ${s.qaDay} · ${s.points} points`)}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h4 className="font-sans font-semibold text-slate-800">{t('Listo para QA', 'Ready for QA')} ({queue.length})</h4>
          <ul className="mt-2 space-y-2">
            {queue.map((s) => {
              const chosen = app.plan.includes(s.id)
              return (
                <li key={s.id} className={`rounded-lg border p-3 text-sm ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={chosen}
                      disabled={locked || app.tested}
                      onChange={() => send(togglePlan(app, s.id, lang))}
                      aria-label={t(`Probar hoy ${s.id}`, `Test ${s.id} today`)}
                    />
                    <span>
                      <span className="font-mono text-xs text-indigo-700">{s.id}</span> · <strong>{s.title}</strong>
                      <span className="block text-xs text-slate-500">
                        {t(`Llegó a QA el día ${s.qaDay}`, `Reached QA on day ${s.qaDay}`)} · {s.points} {t('puntos', 'points')} ·{' '}
                        {s.acReviewed ? t('criterios revisados por QA', 'criteria reviewed by QA') : t('criterios sin revisar por QA', 'criteria not reviewed by QA')}
                      </span>
                      <span className="block text-xs text-slate-700">{t('Si falla: ', 'If it fails: ')}{s.impact}</span>
                      <span className="block text-xs text-slate-700">{t('Qué cambia: ', 'What changes: ')}{s.change}</span>
                      {app.tested && chosen && <span className="mt-1 block text-xs font-medium text-slate-900">{t('Resultado: ', 'Result: ')}{s.finding}</span>}
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
          {!app.tested ? (
            <button
              type="button"
              disabled={locked || app.plan.length === 0}
              onClick={() => send(testPlan(app, lang))}
              className="mt-3 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {t(`Probar las ${app.plan.length} historias elegidas · 3 h`, `Test the ${app.plan.length} chosen stories · 3 h`)}
            </button>
          ) : (
            <p className="mt-3 text-sm text-slate-600">{t('Ya has probado lo que te daba tiempo hoy.', "You've already tested what you had time for today.")}</p>
          )}
        </section>
      </div>
    </div>
  )
}

function FlowView({ app, send, locked, lang }: ViewProps) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const f = flowFacts()
  const stories = storiesFor(lang)
  const days = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  return (
    <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
      <h4 className="font-sans font-semibold text-slate-800">{t('¿Cuándo llegan las historias a QA?', 'When do stories reach QA?')}</h4>
      {!app.analyzed ? (
        <>
          <p className="text-sm text-slate-600">
            {t(
              'Antes de la retro, saca los datos del sprint: cuándo llegó cada historia a QA, su tamaño y si tenía los criterios revisados. Datos, no sensaciones.',
              'Before the retro, pull the sprint data: when each story reached QA, its size and whether its criteria were reviewed. Data, not feelings.',
            )}
          </p>
          <button type="button" disabled={locked} onClick={() => send(analyzeFlow(app, lang))} className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
            {t('Analizar el flujo del sprint · 20 min', 'Analyze the sprint flow · 20 min')}
          </button>
        </>
      ) : (
        <>
          <ol className="flex items-end gap-2" aria-label={t('Historias que llegaron a QA cada día', 'Stories that reached QA each day')}>
            {days.map((d) => {
              const n = stories.filter((s) => s.qaDay === d).length
              return (
                <li key={d} className="flex flex-1 flex-col items-center gap-1 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800">{n || ''}</span>
                  <span className={`w-full rounded-t ${n >= 3 ? 'bg-rose-500' : 'bg-indigo-400'}`} style={{ height: `${Math.max(4, n * 28)}px` }} />
                  <span>{t('Día', 'Day')} {d}</span>
                </li>
              )
            })}
          </ol>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
            <li>
              <strong>
                {f.lateEntries} {t('de', 'of')} {f.total}
              </strong>{' '}
              {t('historias llegaron a QA los días 8 y 9.', 'stories reached QA on days 8 and 9.')}
            </li>
            <li>
              {t('Durante ', 'For ')}
              <strong>{f.daysWithoutArrivals} {t('de 9 días', 'of 9 days')}</strong>
              {t(' no llegó ninguna historia nueva a QA.', ' no new story reached QA.')}
            </li>
            <li>
              {t('Solo ', 'Only ')}
              <strong>
                {f.acReviewed} {t('de', 'of')} {f.total}
              </strong>{' '}
              {t('tenían los criterios de aceptación revisados por QA antes de desarrollar.', 'had their acceptance criteria reviewed by QA before development.')}
            </li>
            <li>
              <strong>
                {f.bigStories} {t('de', 'of')} {f.total}
              </strong>{' '}
              {t('historias son de 5 puntos o más.', 'stories are 5 points or more.')}
            </li>
            <li>
              {t('Hoy hay ', 'Today there are ')}
              <strong>{f.queue} {t('historias', 'stories')}</strong>
              {t(' esperando en «Listo para QA».', ' waiting in “Ready for QA”.')}
            </li>
          </ul>
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            {t(
              'El cuello de botella no es una persona: es el flujo. El trabajo se acumula al final del sprint y llega todo a la vez.',
              'The bottleneck is not a person: it is the flow. Work piles up at the end of the sprint and everything arrives at once.',
            )}
          </p>
        </>
      )}
    </section>
  )
}

function RetroView({ app, send, locked, lang }: ViewProps) {
  const t = (es: string, en: string) => tr(lang, es, en)
  const agreements = agreementsFor(lang)
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
      <h4 className="font-sans font-semibold text-slate-800">{t('Propuestas para la retro de las 16:00', 'Proposals for the 4:00 PM retro')}</h4>
      <p className="text-sm text-slate-600">
        {t(
          `Elige hasta ${MAX_AGREEMENTS} acuerdos de equipo que propondrás. Busca los que atacan la causa y están en manos del equipo.`,
          `Choose up to ${MAX_AGREEMENTS} team agreements you will propose. Look for those that tackle the cause and are in the team's hands.`,
        )}
      </p>
      <ul className="space-y-2">
        {agreements.map((a) => {
          const chosen = app.agreements.includes(a.id)
          return (
            <li key={a.id} className={`rounded-lg border p-3 text-sm ${chosen ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'}`}>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" checked={chosen} disabled={locked || app.proposed} onChange={() => send(toggleAgreement(app, a.id, lang))} aria-label={a.text} />
                <span>
                  {a.text}
                  {app.proposed && chosen && (
                    <span className={`mt-1 block text-xs font-medium ${a.good ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {a.good ? '✓ ' : '✗ '}
                      {a.why}
                    </span>
                  )}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      {!app.proposed ? (
        <button
          type="button"
          disabled={locked || app.agreements.length === 0}
          onClick={() => send(propose(app, lang))}
          className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {t('Preparar las propuestas · 15 min', 'Prepare the proposals · 15 min')}
        </button>
      ) : (
        <p className="text-sm text-slate-600">{t('Propuestas preparadas: las llevarás a la retro.', "Proposals prepared: you'll take them to the retro.")}</p>
      )}
    </section>
  )
}
