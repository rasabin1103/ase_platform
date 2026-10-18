/**
 * Parser de ficheros .feature (Gherkin con pasos de Karate).
 *
 * Soporta: Feature + descripción, Background, Scenario, Scenario Outline
 * (y su alias Scenario Template) con Examples, tags, comentarios, docstrings
 * `"""` y tablas `| a | b |`. Las palabras clave de los pasos son las de
 * Karate: Given, When, Then, And, But y `*`.
 */

export type StepKeyword = 'Given' | 'When' | 'Then' | 'And' | 'But' | '*'

export interface Step {
  keyword: StepKeyword
  /** Texto del paso sin la palabra clave (p. ej. «path 'accounts'»). */
  text: string
  line: number
  docString?: string
  table?: string[][]
}

export interface ScenarioDef {
  kind: 'scenario' | 'outline'
  name: string
  line: number
  tags: string[]
  steps: Step[]
  /** Solo en esquemas: cabecera + filas, con la línea de cada fila. */
  examples?: { tags: string[]; header: string[]; rows: { cells: string[]; line: number }[] }[]
}

export interface FeatureDef {
  name: string
  description: string
  tags: string[]
  line: number
  background?: { line: number; steps: Step[] }
  scenarios: ScenarioDef[]
}

export class ParseError extends Error {
  readonly line: number
  constructor(message: string, line: number) {
    super(message)
    this.name = 'ParseError'
    this.line = line
  }
}

const STEP_RE = /^(Given|When|Then|And|But|\*)(?:\s+|$)(.*)$/
const SECTION_RE = /^(Feature|Background|Scenario Outline|Scenario Template|Scenario|Examples|Scenarios):\s*(.*)$/

function splitRow(line: string): string[] {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  const cells: string[] = []
  let cur = ''
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i]
    if (c === '\\' && inner[i + 1] === '|') {
      cur += '|'
      i++
    } else if (c === '|') {
      cells.push(cur.trim())
      cur = ''
    } else cur += c
  }
  cells.push(cur.trim())
  return cells
}

export function parseFeature(source: string): FeatureDef {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  let feature: FeatureDef | null = null
  let pendingTags: string[] = []
  let currentSteps: Step[] | null = null
  let currentScenario: ScenarioDef | null = null
  let currentExamples: NonNullable<ScenarioDef['examples']>[number] | null = null
  let inDescription = false

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    const lineNo = i + 1
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('#')) continue

    if (line.startsWith('@')) {
      for (const tok of line.split(/\s+/)) {
        if (tok.startsWith('#')) break
        if (!tok.startsWith('@')) throw new ParseError(`tag no válido: «${tok}» (los tags empiezan por @)`, lineNo)
        pendingTags.push(tok.slice(1))
      }
      continue
    }

    const sec = SECTION_RE.exec(line)
    if (sec) {
      const [, kw, title] = sec
      inDescription = false
      if (kw === 'Feature') {
        if (feature) throw new ParseError('solo puede haber un «Feature:» por fichero', lineNo)
        feature = { name: title.trim(), description: '', tags: pendingTags, line: lineNo, scenarios: [] }
        pendingTags = []
        inDescription = true
        continue
      }
      if (!feature) throw new ParseError('el fichero debe empezar por «Feature:»', lineNo)
      if (kw === 'Background') {
        if (feature.background) throw new ParseError('solo puede haber un «Background:»', lineNo)
        if (feature.scenarios.length) throw new ParseError('«Background:» debe ir antes del primer escenario', lineNo)
        feature.background = { line: lineNo, steps: [] }
        currentSteps = feature.background.steps
        currentScenario = null
        currentExamples = null
        continue
      }
      if (kw === 'Scenario' || kw === 'Scenario Outline' || kw === 'Scenario Template') {
        currentScenario = { kind: kw === 'Scenario' ? 'scenario' : 'outline', name: title.trim(), line: lineNo, tags: pendingTags, steps: [] }
        if (currentScenario.kind === 'outline') currentScenario.examples = []
        pendingTags = []
        feature.scenarios.push(currentScenario)
        currentSteps = currentScenario.steps
        currentExamples = null
        continue
      }
      // Examples
      if (!currentScenario || currentScenario.kind !== 'outline') throw new ParseError('«Examples:» solo puede ir dentro de un «Scenario Outline:»', lineNo)
      currentExamples = { tags: pendingTags, header: [], rows: [] }
      pendingTags = []
      currentScenario.examples!.push(currentExamples)
      currentSteps = null
      continue
    }

    if (!feature) throw new ParseError('el fichero debe empezar por «Feature:»', lineNo)

    if (line.startsWith('|')) {
      if (currentExamples) {
        const cells = splitRow(line)
        if (currentExamples.header.length === 0) currentExamples.header = cells
        else {
          if (cells.length !== currentExamples.header.length) throw new ParseError(`la fila tiene ${cells.length} columnas y la cabecera ${currentExamples.header.length}`, lineNo)
          currentExamples.rows.push({ cells, line: lineNo })
        }
        continue
      }
      const last = currentSteps?.[currentSteps.length - 1]
      if (!last) throw new ParseError('tabla fuera de un paso', lineNo)
      ;(last.table ??= []).push(splitRow(line))
      continue
    }

    if (line.startsWith('"""')) {
      const last = currentSteps?.[currentSteps.length - 1]
      if (!last) throw new ParseError('docstring («"""») fuera de un paso', lineNo)
      const indent = raw.indexOf('"""')
      const body: string[] = []
      let j = i + 1
      for (; j < lines.length; j++) {
        if (lines[j].trim().startsWith('"""')) break
        const l = lines[j]
        body.push(l.slice(0, indent).trim() === '' ? l.slice(indent) : l.trimStart())
      }
      if (j >= lines.length) throw new ParseError('docstring sin cerrar: falta el «"""» final', lineNo)
      last.docString = body.join('\n')
      i = j
      continue
    }

    const st = STEP_RE.exec(line)
    if (st) {
      if (!currentSteps) {
        if (currentExamples) throw new ParseError('después de «Examples:» solo van filas de la tabla', lineNo)
        throw new ParseError('paso fuera de un escenario: falta «Scenario:» o «Background:»', lineNo)
      }
      inDescription = false
      currentSteps.push({ keyword: st[1] as StepKeyword, text: st[2].trim(), line: lineNo })
      continue
    }

    if (inDescription && !currentScenario && !feature.background) {
      feature.description += (feature.description ? '\n' : '') + line
      continue
    }
    const first = line.split(/\s+/)[0]
    const lower = first.toLowerCase()
    const hint = ['given', 'when', 'then', 'and', 'but'].includes(lower)
      ? ` (las palabras clave van con mayúscula: «${lower[0].toUpperCase()}${lower.slice(1)}»)`
      : /^(url|path|method|status|match|def|param|header|request|print|assert)$/.test(first)
        ? ` (falta la palabra clave al principio: «* ${line}»)`
        : ''
    throw new ParseError(`línea no reconocida: «${line}»${hint}`, lineNo)
  }
  if (!feature) throw new ParseError('el fichero está vacío: empieza por «Feature:»', 1)
  for (const sc of feature.scenarios) {
    // Examples dinámicos: una sola celda de cabecera con una expresión, p. ej. | read('datos.json') |
    const dynamic = (e: { header: string[]; rows: unknown[] }) => e.rows.length === 0 && e.header.length === 1 && /[(.[]/.test(e.header[0])
    if (sc.kind === 'outline' && (!sc.examples?.length || sc.examples.every((e) => e.rows.length === 0 && !dynamic(e)))) {
      throw new ParseError(`el esquema «${sc.name}» no tiene filas en «Examples:»`, sc.line)
    }
  }
  return feature
}
