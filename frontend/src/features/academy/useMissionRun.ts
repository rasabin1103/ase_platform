import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { getAcademyRun, saveAcademyRun } from './api'
import { createRun, replay, step } from './engine/engine'
import type { Action, Mission } from './engine/types'

/**
 * Estado de una partida con persistencia.
 *
 * Solo se guardan la semilla y la lista de acciones; al volver se reproduce
 * la partida con el motor determinista.
 * - Con sesión iniciada: se guarda en el backend (`academy_runs`) tras cada
 *   acción, así el progreso sigue al usuario entre dispositivos y sesiones.
 *   localStorage queda como copia local por si falla la red.
 * - Sin sesión (misiones gratuitas de demo): solo en este navegador.
 */

const STORAGE_PREFIX = 'ase_academy_run_v2'
const SAVE_DEBOUNCE_MS = 700

interface Saved {
  seed: number
  actions: Action[]
  finished?: boolean
}

type MissionRef = Pick<Mission, 'courseKey' | 'id'>

export function storageKey(mission: MissionRef, userKey: string): string {
  return `${STORAGE_PREFIX}:${userKey}:${mission.courseKey}:${mission.id}`
}

function newSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}

function readLocal(mission: MissionRef, userKey: string): Saved | null {
  try {
    const raw = localStorage.getItem(storageKey(mission, userKey))
    if (!raw) return null
    const saved = JSON.parse(raw) as Saved
    return typeof saved.seed === 'number' && Array.isArray(saved.actions) ? saved : null
  } catch {
    return null
  }
}

function writeLocal(mission: MissionRef, userKey: string, data: Saved): void {
  try {
    localStorage.setItem(storageKey(mission, userKey), JSON.stringify(data))
  } catch {
    // Sin almacenamiento local la partida sigue funcionando.
  }
}

function hydrate(mission: Mission, saved: Saved | null) {
  if (saved) {
    try {
      return { seed: saved.seed, actions: saved.actions, state: replay(mission, saved.seed, saved.actions) }
    } catch {
      // Contenido incompatible (p. ej. la misión cambió): partida nueva.
    }
  }
  const seed = newSeed()
  return { seed, actions: [] as Action[], state: createRun(mission, seed) }
}

/** Estado local de una misión (para el escaparate cuando no hay sesión). */
export function readMissionStatus(mission: MissionRef, userKey = 'anon'): 'new' | 'in_progress' | 'finished' {
  const saved = readLocal(mission, userKey)
  if (!saved) return 'new'
  return saved.finished ? 'finished' : saved.actions.length > 0 ? 'in_progress' : 'new'
}

export type SyncStatus = 'local' | 'loading' | 'saved' | 'saving' | 'error'

/** Clave del usuario para separar el progreso local de cada cuenta. */
export function useAcademyUserKey(): { userKey: string; authReady: boolean; authenticated: boolean } {
  const { currentUser, isAuthenticated, isLoading } = useAuth()
  return { userKey: currentUser ? `u${currentUser.uuid}` : 'anon', authReady: !isLoading, authenticated: isAuthenticated }
}

/**
 * Montar solo cuando la sesión ya está resuelta (ver AcademyPlayerPage, que
 * usa `key` para remontar si cambia el usuario).
 */
export function useMissionRun(mission: Mission) {
  const { userKey, authenticated: remote } = useAcademyUserKey()
  const [run, setRun] = useState(() => hydrate(mission, readLocal(mission, userKey)))
  const [sync, setSync] = useState<SyncStatus>(remote ? 'loading' : 'local')
  const stateRef = useRef(run.state)
  const loading = useRef(remote)
  const dirty = useRef(false)

  // Carga inicial desde el servidor: gana la copia con más progreso.
  useEffect(() => {
    if (!remote) return
    let cancelled = false
    const local = readLocal(mission, userKey)
    getAcademyRun(mission.courseKey, mission.id)
      .then((server) => {
        if (cancelled) return
        loading.current = false
        if (server && server.actions.length >= (local?.actions.length ?? 0)) {
          setRun(hydrate(mission, server))
        } else if (local && local.actions.length > 0) {
          // La copia local tiene más progreso (p. ej. se jugó sin conexión): se sube.
          dirty.current = true
          setRun(hydrate(mission, local))
        }
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
  }, [remote, userKey, mission])

  // Guardado: local inmediato; servidor con un pequeño retardo tras cada acción.
  useEffect(() => {
    stateRef.current = run.state
    const data: Saved = { seed: run.seed, actions: run.actions, finished: run.state.finished }
    writeLocal(mission, userKey, data)
    if (!remote || loading.current || !dirty.current) return
    const t = window.setTimeout(() => {
      setSync('saving')
      saveAcademyRun(mission.courseKey, mission.id, { seed: data.seed, actions: data.actions, finished: !!data.finished })
        .then(() => {
          dirty.current = false
          setSync('saved')
        })
        .catch(() => setSync('error'))
    }, SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [mission, run, remote, userKey])

  const dispatch = useCallback(
    (action: Action) => {
      setRun((prev) => {
        const state = step(mission, prev.state, action)
        if (state === prev.state) return prev
        stateRef.current = state
        dirty.current = true
        return { seed: prev.seed, actions: [...prev.actions, action], state }
      })
    },
    [mission],
  )

  const restart = useCallback(() => {
    const seed = newSeed()
    const state = createRun(mission, seed)
    stateRef.current = state
    dirty.current = true
    setRun({ seed, actions: [], state })
  }, [mission])

  return { state: run.state, stateRef, dispatch, restart, sync }
}
