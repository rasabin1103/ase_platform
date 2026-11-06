import type { PyRunner, PyRunRequest, PyRunResult } from './core'

/**
 * Ejecutor de Python del navegador: un Web Worker con Pyodide compartido por
 * toda la página. Si un programa tarda más de RUN_TIMEOUT_MS (un bucle
 * infinito, por ejemplo), se termina el worker y se crea otro.
 */

const RUN_TIMEOUT_MS = 8000
const LOAD_TIMEOUT_MS = 60000

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: number }

export class TimeoutError extends Error {}

class WorkerRunner implements PyRunner {
  private worker: Worker | null = null
  private seq = 0
  private pending = new Map<number, Pending>()
  private loaded: Promise<void> | null = null

  private spawn(): Worker {
    const w = new Worker(new URL('./pyWorker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (ev: MessageEvent<{ id: number; ok: boolean; result?: unknown; error?: string }>) => {
      const p = this.pending.get(ev.data.id)
      if (!p) return
      window.clearTimeout(p.timer)
      this.pending.delete(ev.data.id)
      if (ev.data.ok) p.resolve(ev.data.result)
      else {
        // El motivo real queda en la consola para poder diagnosticarlo.
        console.error('[python]', ev.data.error)
        p.reject(new Error(ev.data.error ?? 'Python error'))
      }
    }
    w.onerror = (ev) => {
      console.error('[python] worker', ev.message)
      this.reset(new Error(ev.message || 'Python worker error'))
    }
    return w
  }

  private reset(err: Error) {
    this.worker?.terminate()
    this.worker = null
    this.loaded = null
    for (const p of this.pending.values()) {
      window.clearTimeout(p.timer)
      p.reject(err)
    }
    this.pending.clear()
  }

  private send(type: 'load' | 'run', req: PyRunRequest | undefined, timeout: number): Promise<unknown> {
    if (!this.worker) this.worker = this.spawn()
    const id = ++this.seq
    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => this.reset(new TimeoutError('timeout')), timeout)
      this.pending.set(id, { resolve, reject, timer })
      this.worker!.postMessage({ id, type, req })
    })
  }

  /** Carga Pyodide (la primera vez tarda unos segundos). */
  load(): Promise<void> {
    if (!this.loaded) this.loaded = this.send('load', undefined, LOAD_TIMEOUT_MS).then(() => undefined)
    return this.loaded
  }

  async run(req: PyRunRequest): Promise<PyRunResult> {
    await this.load()
    return (await this.send('run', req, RUN_TIMEOUT_MS)) as PyRunResult
  }
}

let shared: WorkerRunner | null = null

export function browserRunner(): WorkerRunner {
  if (!shared) shared = new WorkerRunner()
  return shared
}
