import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const BACKEND = path.resolve(here, '../../backend')
const SCRIPT = path.join(BACKEND, 'scripts', 'e2e_academy.py')

export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'E2e-Academy!2026'
export const emailFor = (course: string, lang: string) => `e2e.${course}.${lang}@arcesabinengineering.com`

/** scripts/e2e_academy.py (solo funciona contra una base de datos local). */
export function backendScript(...args: string[]): string {
  return execFileSync(process.env.E2E_PYTHON ?? 'python3', [SCRIPT, ...args], {
    cwd: BACKEND,
    env: { ...process.env, E2E_PASSWORD },
    encoding: 'utf-8',
  })
}
