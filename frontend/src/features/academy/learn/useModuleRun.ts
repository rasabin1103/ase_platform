import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAcademyRun, saveAcademyRun } from '../api'
import type { Action } from '../engine/types'
import { storageKey, useAcademyUserKey, type SyncStatus } from '../useMissionRun'
import { moduleProgress, passedIds, type LessonModule } from './types'

/**
 * Progreso de un módulo con persistencia, con el mismo almacenamiento que las
 * misiones (academy_runs y copia local): la «partida» es la lista de bloques
 * superados, como acciones {type: 'pass', id}. Así el progreso del curso, el
 * acceso y el certificado funcionan igual que en los cursos de simulación.
 */

type PassAction = { type: 'pass'; id: string }
interface Saved {
  seed: number
  actions: PassAction[]
  finished?: boolean
}

const SAVE_DEBOUNCE_MS = 700

function readLocal(key: string): Saved | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const saved = JSON.parse(raw) as Saved
    return Array.isArray(saved.actions) ? saved : null
  } catch {
    return null
  }
}

function writeLocal(key: string, data: Saved) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // Sin almacenamiento local el módulo sigue funcionando.
  }
}

const clean = (actions: unknown[]): PassAction[] =>
  actions.filter((a): a is PassAction => !!a && typeof a === 'object' && (a as PassAction).type === 'pass' && typeof (a as PassAction).id === 'string')

export function useModuleRun(module: LessonModule) {
  const { userKey, authenticated: remote } = useAcademyUserKey()
  const key = storageKey({ courseKey: module.courseKey, id: module.id }, userKey)
  const [actions, setActions] = useState<PassAction[]>(() => clean(readLocal(key)?.actions ?? []))
  const [sync, setSync] = useState<SyncStatus>(remote ? 'loading' : 'local')
  const loading = useRef(remote)
  const dirty = useRef(false)
  const pending = useRef<Saved | null>(null)

  useEffect(() => {
    if (!remote) return
    let cancelled = false
    getAcademyRun(module.courseKey, module.id)
      .then((server) => {
        if (cancelled) return
        loading.current = false
        const local = clean(readLocal(key)?.actions ?? [])
        const remoteActions = clean((server?.actions ?? []) as unknown[])
        // Se unen las dos copias: superar un bloque nunca se pierde.
        const merged = [...remoteActions]
        const seen = new Set(merged.map((a) => a.id))
        for (const a of local) if (!seen.has(a.id)) merged.push(a)
        if (merged.length > remoteActions.length) dirty.current = true
        setActions(merged)
        setSync('saved')
      })
      .catch(() => {
        if (cancelled) return
        loading.current = false
        setSync('error')
      })
    return () => {
      cancelled = true
    }
  }, [remote, key, module])

  const passed = useMemo(() => passedIds(actions), [actions])
  const progress = useMemo(() => moduleProgress(module, passed), [module, passed])

  useEffect(() => {
    const data: Saved = { seed: 0, actions, finished: progress.finished }
    writeLocal(key, data)
    if (!remote || loading.current || !dirty.current) return
    pending.current = data
    const t = window.setTimeout(() => {
      pending.current = null
      setSync('saving')
      saveAcademyRun(module.courseKey, module.id, { seed: 0, actions: data.actions as unknown as Action[], finished: !!data.finished })
        .then(() => {
          dirty.current = false
          setSync('saved')
        })
        .catch(() => setSync('error'))
    }, SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [actions, progress.finished, key, module, remote])

  useEffect(
    () => () => {
      const data = pending.current
      if (!data) return
      pending.current = null
      void saveAcademyRun(module.courseKey, module.id, { seed: 0, actions: data.actions as unknown as Action[], finished: !!data.finished }).catch(() => {})
    },
    [module],
  )

  const pass = useCallback((id: string) => {
    setActions((prev) => {
      if (prev.some((a) => a.id === id)) return prev
      dirty.current = true
      return [...prev, { type: 'pass', id }]
    })
  }, [])

  const reset = useCallback(() => {
    dirty.current = true
    setActions([])
  }, [])

  return { passed, progress, pass, reset, sync }
}
