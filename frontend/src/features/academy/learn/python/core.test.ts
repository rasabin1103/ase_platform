// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { gradeExercise, normalizeOutput } from './grade'
import { explainError } from './errors'
import { nodeRunner } from './nodeRunner'

const py = nodeRunner()

describe('Python en el navegador: ejecutar y corregir', () => {
  it('captura la salida, simula input() y ejecuta aserciones en el mismo espacio', async () => {
    const r = await py.run({ code: 'n = input("¿Nombre? ")\nprint("Hola", n)\nx = 3', inputs: ['Ana'], asserts: ['assert x == 3', 'assert x == 4, "x debería ser 4"'] })
    expect(r.ok).toBe(true)
    expect(r.stdout).toBe('¿Nombre? Ana\nHola Ana\n')
    expect(r.asserts).toEqual([{ ok: true }, { ok: false, message: 'x debería ser 4' }])
  }, 60_000)

  it('cada ejecución empieza limpia', async () => {
    await py.run({ code: 'secreto = 1' })
    const r = await py.run({ code: 'print(secreto)' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatchObject({ type: 'NameError', line: 1 })
  })

  it('errores con línea y explicación; input() sin datos', async () => {
    const syn = await py.run({ code: 'print("a")\nprint("b"' })
    expect(syn.error?.type).toBe('SyntaxError')
    expect(syn.error?.line).toBe(2)
    const typ = await py.run({ code: 'a = 1\nb = "2"\nprint(a + b)' })
    expect(typ.error).toMatchObject({ type: 'TypeError', line: 3 })
    expect(explainError(typ.error!, 'es').title).toBe('TypeError en la línea 3')
    const eof = await py.run({ code: 'input()' })
    expect(explainError(eof.error!, 'en').message).toBe('input() has no more data')
  })

  it('corrige por salida, por aserción y por forma del código', async () => {
    const ex = {
      tests: [
        { kind: 'output' as const, label: 'saluda', expected: 'Ana\nHola, Ana', inputs: ['Ana'] },
        { kind: 'output' as const, label: 'saluda a otro', expected: 'Luis\nHola, Luis', inputs: ['Luis'] },
        { kind: 'assert' as const, label: 'guarda el nombre', code: 'assert nombre == "Ana"', inputs: ['Ana'] },
        { kind: 'source' as const, label: 'usa f-string', pattern: /f["']/ },
      ],
    }
    const good = await gradeExercise(py, ex, 'nombre = input()\nprint(f"Hola, {nombre}")')
    expect(good.passed).toBe(true)
    const bad = await gradeExercise(py, ex, 'nombre = input()\nprint("Hola, Ana")')
    expect(bad.tests.map((t) => t.ok)).toEqual([true, false, true, false])
    expect(normalizeOutput('a  \nb\n\n')).toBe('a\nb')
  })
})

describe('Pyodide servido desde nuestro dominio', () => {
  it('la versión del paquete es la que carga el navegador', async () => {
    const { PYODIDE_VERSION } = await import('./core')
    const { version } = await import('pyodide')
    expect(version).toBe(PYODIDE_VERSION)
  })
})
