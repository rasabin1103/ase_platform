/**
 * Cursos instructivos (formato «lecciones»): un curso se divide en módulos,
 * cada módulo en lecciones cortas y cada lección en bloques. Ver
 * docs/academy/python-desde-cero/PLAN.md.
 */

export type LearnLang = 'es' | 'en'

/** Texto con el Markdown mínimo de RichText. */
export interface TextBlock {
  kind: 'text'
  md: string
}

/** Ejemplo ejecutable: el alumno puede editarlo y ejecutarlo. */
export interface ExampleBlock {
  kind: 'example'
  id: string
  code: string
  /** Lo que «escribe» el usuario cuando el ejemplo llama a input(). */
  inputs?: string[]
  note?: string
}

/** «¿Qué imprime?»: leer código antes de escribirlo. */
export interface PredictBlock {
  kind: 'predict'
  id: string
  code: string
  question: string
  options: string[]
  correct: number
  explanation: string
  /** Lo que escribe el usuario si el código usa input() (solo para comprobar el contenido). */
  inputs?: string[]
}

/** La salida del programa (sin espacios al final de cada línea) debe ser exactamente esta. */
export interface OutputTest {
  kind: 'output'
  label: string
  expected: string
  inputs?: string[]
}

/** Código Python que se ejecuta después del programa, en su mismo espacio de nombres. */
export interface AssertTest {
  kind: 'assert'
  label: string
  code: string
  inputs?: string[]
}

/** El código fuente tiene (o no tiene) cierta forma. */
export interface SourceTest {
  kind: 'source'
  label: string
  pattern: RegExp
  /** true: el código NO debe contener el patrón. */
  forbid?: boolean
}

export type ExerciseTest = OutputTest | AssertTest | SourceTest

export interface ExerciseBlock {
  kind: 'exercise'
  id: string
  title: string
  prompt: string
  starter: string
  solution: string
  tests: ExerciseTest[]
  /** Pistas de menos a más concretas. */
  hints: string[]
  /** Entradas de ejemplo para el botón «Ejecutar» (una por línea). */
  sampleInputs?: string[]
  /** Pieza del proyecto del curso. */
  project?: boolean
}

export type LessonBlock = TextBlock | ExampleBlock | PredictBlock | ExerciseBlock

export interface Lesson {
  id: string
  title: string
  minutes: number
  blocks: LessonBlock[]
}

export interface LessonModule {
  courseKey: string
  id: string
  number: number
  lang: LearnLang
  title: string
  subtitle: string
  /** Qué vas a aprender (lista corta). */
  goals: string[]
  lessons: Lesson[]
  /**
   * Examen práctico: cada ejercicio vale `points`; el módulo solo cuenta como
   * terminado con `passMark` o más. Sin pistas ni solución.
   */
  exam?: { passMark: number; points: number }
}

/** Bloques que cuentan para completar el módulo. */
export type GradedBlock = PredictBlock | ExerciseBlock

export function gradedBlocks(module: LessonModule): GradedBlock[] {
  return module.lessons.flatMap((l) => l.blocks.filter((b): b is GradedBlock => b.kind === 'predict' || b.kind === 'exercise'))
}

/** Ids de los bloques corregidos que ya se han superado, a partir de las acciones guardadas. */
export function passedIds(actions: { type: string; id?: unknown }[]): Set<string> {
  const out = new Set<string>()
  for (const a of actions) if (a.type === 'pass' && typeof a.id === 'string') out.add(a.id)
  return out
}

export interface ModuleProgress {
  passed: number
  total: number
  /** Solo en el examen práctico. */
  score: number | null
  finished: boolean
}

export function moduleProgress(module: LessonModule, passed: Set<string>): ModuleProgress {
  const graded = gradedBlocks(module)
  const ok = graded.filter((b) => passed.has(b.id)).length
  if (module.exam) {
    const score = graded.filter((b) => b.kind === 'exercise' && passed.has(b.id)).length * module.exam.points
    return { passed: ok, total: graded.length, score, finished: score >= module.exam.passMark }
  }
  return { passed: ok, total: graded.length, score: null, finished: graded.length > 0 && ok === graded.length }
}
