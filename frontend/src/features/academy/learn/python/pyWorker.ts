import { PYODIDE_BASE, runWith, type PyodideLike, type PyRunRequest } from './core'

/**
 * Web Worker con Pyodide: así un bucle infinito no bloquea la página (el hilo
 * principal termina el worker si no responde a tiempo, ver browserRunner.ts).
 */

type LoadPyodide = (opts: { indexURL: string }) => Promise<PyodideLike>

let ready: Promise<PyodideLike> | null = null

function load(): Promise<PyodideLike> {
  if (!ready) {
    const base = new URL(PYODIDE_BASE, self.location.origin).href
    ready = import(/* @vite-ignore */ `${base}pyodide.mjs`).then((m: { loadPyodide: LoadPyodide }) => m.loadPyodide({ indexURL: base }))
  }
  return ready
}

const ctx = self as unknown as { onmessage: ((ev: MessageEvent) => void) | null; postMessage(message: unknown): void }

ctx.onmessage = async (ev: MessageEvent<{ id: number; type: 'load' | 'run'; req?: PyRunRequest }>) => {
  const { id, type, req } = ev.data
  try {
    const py = await load()
    if (type === 'load') ctx.postMessage({ id, ok: true })
    else ctx.postMessage({ id, ok: true, result: runWith(py, req!) })
  } catch (e) {
    ctx.postMessage({ id, ok: false, error: String(e instanceof Error ? e.message : e) })
  }
}
