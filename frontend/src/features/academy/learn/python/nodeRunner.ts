import { loadPyodide } from 'pyodide'
import { runWith, type PyodideLike, type PyRunner } from './core'

/** Ejecutor de Python para los tests (Node), con el paquete `pyodide` de desarrollo. */
let py: Promise<PyodideLike> | null = null

export function nodeRunner(): PyRunner {
  if (!py) py = loadPyodide() as unknown as Promise<PyodideLike>
  return { run: async (req) => runWith(await py!, req) }
}
