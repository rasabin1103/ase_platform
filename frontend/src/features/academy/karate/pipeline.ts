/**
 * Runners de Karate en Java (JUnit 5) para el pipeline simulado.
 *
 * No se compila Java: se lee lo que importa del runner —ruta, tags, hilos y si
 * comprueba los fallos— y se valida lo básico (llaves y paréntesis, punto y
 * coma). Es lo que decide qué se ejecuta en el pipeline y si el build falla.
 */

export interface RunnerSpec {
  file: string
  className: string
  /** Carpeta de features (classpath:openapi → src/test/java/openapi/). */
  root: string | null
  /** Tags de .tags(…): cada argumento es un grupo (AND); dentro, comas (OR). Sin @. */
  tagGroups: string[][]
  threads: number
  /** El test falla cuando hay escenarios fallidos (assertEquals(0, results.getFailCount() …)). */
  asserts: boolean
  /** Informes extra que publica el pipeline: cucumber-json, junit-xml. */
  reports: string[]
  /** Errores de compilación (si hay, el build falla sin ejecutar nada). */
  errors: string[]
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/\/\/[^\n]*/g, '')
}

function balanced(src: string): string | null {
  const stack: string[] = []
  const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' }
  let quote: string | null = null
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'") quote = c
    else if ('({['.includes(c)) stack.push(c)
    else if (')}]'.includes(c)) {
      if (stack.pop() !== pairs[c]) return `«${c}» sin abrir`
    }
  }
  if (quote) return 'cadena sin cerrar'
  return stack.length ? `falta cerrar «${stack[stack.length - 1]}»` : null
}

const strings = (args: string) => Array.from(args.matchAll(/"((?:[^"\\]|\\.)*)"/g), (m) => m[1])

export function parseRunner(file: string, source: string): RunnerSpec {
  const src = stripComments(source)
  const errors: string[] = []
  const className = /\bclass\s+([A-Za-z_]\w*)/.exec(src)?.[1] ?? file.split('/').pop()!.replace(/\.java$/, '')
  const expected = file.split('/').pop()!.replace(/\.java$/, '')
  if (className !== expected) errors.push(`la clase ${className} debería llamarse ${expected} (como el fichero)`)
  const unbalanced = balanced(src)
  if (unbalanced) errors.push(unbalanced)

  const legacy = /Karate\.run\s*\(/.test(src)
  const pathArg = /Runner\.path\s*\(([^)]*)\)/.exec(src)?.[1] ?? /Karate\.run\s*\(([^)]*)\)/.exec(src)?.[1] ?? ''
  const first = strings(pathArg)[0]
  const root = first ? 'src/test/java/' + first.replace(/^classpath:/, '').replace(/^\/+|\/+$/g, '') + '/' : null

  const tagGroups: string[][] = []
  for (const m of src.matchAll(/\.tags\s*\(([^)]*)\)/g)) {
    for (const s of strings(m[1])) tagGroups.push(s.split(',').map((t) => t.trim().replace(/^(~?)@/, '$1')).filter(Boolean))
  }

  let threads = 1
  const par = /\.parallel\s*\(\s*([^)]*)\)/.exec(src)
  if (par) {
    const n = Number(par[1].trim())
    if (!Number.isInteger(n) || n < 1) errors.push(`parallel(${par[1].trim()}): se esperaba un número de hilos`)
    else threads = Math.min(n, 16)
    if (!/\.parallel\s*\([^)]*\)\s*;/.test(src)) errors.push("falta «;» después de .parallel(…)")
  } else if (!legacy) errors.push('el runner no ejecuta nada: falta Runner.path(…)…parallel(n)')

  // Karate.run con @Karate.Test genera un test JUnit por escenario: los fallos rompen el build.
  const asserts =
    legacy ||
    /assertEquals\s*\(\s*0\s*,\s*results\.getFailCount\s*\(\s*\)/.test(src) ||
    /assertEquals\s*\(\s*results\.getFailCount\s*\(\s*\)\s*,\s*0\s*[,)]/.test(src) ||
    /assertTrue\s*\(\s*results\.getFailCount\s*\(\s*\)\s*==\s*0/.test(src)
  if (/results\./.test(src) && !/Results\s+results\s*=/.test(src)) errors.push('cannot find symbol: results (falta «Results results = Runner…»)')
  if (/assert(Equals|True)\s*\(/.test(src) && !/import\s+static\s+org\.junit\.jupiter\.api\.Assertions\.\*?/.test(src) && !/Assertions\.assert/.test(src)) {
    errors.push('cannot find symbol: assertEquals (falta «import static org.junit.jupiter.api.Assertions.*;»)')
  }
  const reports: string[] = []
  if (/\.outputCucumberJson\s*\(\s*true\s*\)/.test(src)) reports.push('cucumber-json')
  if (/\.outputJunitXml\s*\(\s*true\s*\)/.test(src)) reports.push('junit-xml')
  return { file, className, root, tagGroups, threads: legacy ? 1 : threads, asserts, reports, errors }
}
