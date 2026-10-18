import type { Condition } from '../engine/types'
import type { ServerFactory } from './http'
import type { ScenarioResult, Smell } from './runner'
import type { RunnerSpec } from './pipeline'

/** Reto de una misión de código: un objetivo que se comprueba al ejecutar. */
export interface CodeReto {
  id: string
  title: string
  /** Qué hay que conseguir (markdown ligero: **negrita**, `código`). */
  description: string
  /** Pista que el alumno puede desplegar. */
  hint: string
  /** Solo aparece cuando se cumple (p. ej. tras un despliegue). */
  visibleWhen?: Condition
  /** ¿Lo cumple esta ejecución? Recibe los escenarios ejecutados. */
  check: (scenarios: ScenarioResult[], flags: Record<string, boolean>, ctx: RetoContext) => boolean
}

/** Contexto de una ejecución para comprobar retos. */
export interface RetoContext {
  /** karate.env de la ejecución. */
  env: string
  /** Ficheros del proyecto tal como se ejecutaron. */
  files: Record<string, string>
  /** Todo pasa o solo falla por bugs reales de la API. */
  green: boolean
  /** Solo en ejecuciones del pipeline (botón «Pipeline»). */
  pipeline?: PipelineContext
}

/** Resultado de una ejecución del pipeline para comprobar retos. */
export interface PipelineContext {
  job: string
  /** Número de ejecución del pipeline (también la semilla del orden). */
  run: number
  spec: RunnerSpec
  build: 'SUCCESS' | 'FAILURE'
  wallMs: number
  /** Ejecuciones seguidas de este job en las que nada falla por culpa de los tests (incluida esta). */
  streak: number
}

/** Un job del pipeline de CI: qué runner ejecuta y cuándo. */
export interface PipelineJob {
  id: string
  label: string
  /** Cuándo se lanza (texto para el IDE: «en cada pull request», «cada noche»). */
  trigger: string
  /** Fichero del runner JUnit 5. */
  runner: string
}

/** Entorno elegible en el IDE (como -Dkarate.env=…). */
export interface CodeLabEnv {
  id: string
  label: string
  /** Propiedades del sistema de ese entorno (-Dclave=valor), p. ej. secretos de CI. */
  properties?: Record<string, string>
}

export interface CodeLabFile {
  path: string
  content: string
  readOnly?: boolean
}

/**
 * Laboratorio de código de una misión (IDE de Karate). Lo usa la app
 * `karate-ide`; ver features/academy/karate/ y docs/academy/karate-framework/PLAN.md.
 */
export interface CodeLabModel {
  /** API simulada según el estado de la partida (p. ej. la versión desplegada). */
  server: (flags: Record<string, boolean>) => ServerFactory
  /** Variables globales, como las que devolvería karate-config.js. */
  config: Record<string, unknown>
  env?: string
  /** Proyecto inicial. */
  files: CodeLabFile[]
  retos: CodeReto[]
  /** Minutos de jornada de una ejecución (incluye el primer escenario). */
  runCost: number
  /** Minutos por cada escenario adicional. */
  scenarioCost: number
  /** Fragmentos del panel «Insertar». */
  snippets: { label: string; code: string }[]
  /** Pasos en los que se fija el mentor cuando aparecen malos olores. */
  smells?: Smell[]
  /**
   * Fichero karate-config.js del proyecto: si se indica, se ejecuta antes de
   * cada escenario y sustituye a `config`.
   */
  configFile?: string
  /** Entornos que el alumno puede elegir (el primero es el de por defecto). */
  envs?: CodeLabEnv[]
  /** Modo examen: los retos no muestran pistas. */
  exam?: boolean
  /** El alumno puede crear (y borrar) sus propios ficheros bajo esta carpeta. */
  newFiles?: { root: string }
  /** Pipeline de CI simulado: jobs que ejecutan los runners Java. */
  pipeline?: { jobs: PipelineJob[]; /** Minutos de jornada que cuesta cada ejecución. */ cost: number }
}
