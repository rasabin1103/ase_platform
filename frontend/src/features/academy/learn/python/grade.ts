import type { ExerciseBlock, ExerciseTest } from '../types'
import type { PyError, PyRunner } from './core'

/**
 * Corrección de un ejercicio: el programa se ejecuta una vez por cada juego de
 * entradas distinto, y cada test se comprueba sobre la ejecución que le toca.
 */

export interface TestOutcome {
  label: string
  ok: boolean
  /** Lo que salió (para los tests de salida). */
  got?: string
  expected?: string
  message?: string
  error?: PyError
}

export interface GradeResult {
  passed: boolean
  tests: TestOutcome[]
  /** Error del programa (si no llegó a terminar con alguna de las entradas). */
  error: PyError | null
}

/** Sin espacios al final de cada línea ni líneas vacías al final. */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '')
}

const inputsKey = (t: ExerciseTest) => (t.kind === 'source' ? '' : JSON.stringify(t.inputs ?? []))

export async function gradeExercise(runner: PyRunner, exercise: Pick<ExerciseBlock, 'tests'>, code: string): Promise<GradeResult> {
  const outcomes = new Map<ExerciseTest, TestOutcome>()
  let firstError: PyError | null = null

  for (const t of exercise.tests) {
    if (t.kind !== 'source') continue
    const has = t.pattern.test(code)
    outcomes.set(t, { label: t.label, ok: t.forbid ? !has : has })
  }

  const groups = new Map<string, ExerciseTest[]>()
  for (const t of exercise.tests) {
    if (t.kind === 'source') continue
    const k = inputsKey(t)
    groups.set(k, [...(groups.get(k) ?? []), t])
  }

  for (const [key, tests] of groups) {
    const inputs = JSON.parse(key) as string[]
    const asserts = tests.filter((t) => t.kind === 'assert').map((t) => (t.kind === 'assert' ? t.code : ''))
    const r = await runner.run({ code, inputs, asserts })
    if (!r.ok && !firstError) firstError = r.error
    let ai = 0
    for (const t of tests) {
      if (t.kind === 'output') {
        const got = normalizeOutput(r.stdout)
        const expected = normalizeOutput(t.expected)
        outcomes.set(t, { label: t.label, ok: r.ok && got === expected, got, expected, error: r.ok ? undefined : (r.error ?? undefined) })
      } else if (t.kind === 'assert') {
        const a = r.asserts[ai++]
        outcomes.set(t, { label: t.label, ok: !!a?.ok, message: a?.message || undefined, error: a?.error ?? (r.ok ? undefined : (r.error ?? undefined)) })
      }
    }
  }

  const tests = exercise.tests.map((t) => outcomes.get(t)!)
  return { passed: tests.every((t) => t.ok), tests, error: firstError }
}
