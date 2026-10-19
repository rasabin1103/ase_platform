import { describe, expect, it } from 'vitest'
import runnerSrc from './runner.ts?raw'
import jsSrc from './js.ts?raw'
import parserSrc from './parser.ts?raw'
import pipelineSrc from './pipeline.ts?raw'
import openApiSrc from './apis/kobaltoOpenApi.ts?raw'
import paymentsSrc from './apis/kobaltoPayments.ts?raw'
import { logEn, messageEn } from './messagesEn'

// Palabras que delatan un mensaje que se quedó en español.
const SPANISH = /(^|[^\p{L}])(no se|falta|usa|se esperaba|debe|está|tiene|fichero|línea|llegó|esperaba|demasiad|todavía|sin abrir|ningún|escenario|condición|arrancado|hilo|caché|soportad|válid|definido|permitida|ruta|puerto|ya hay)(?=[^\p{L}]|$)|[¿¡]/iu

/**
 * Mensajes del motor: cada texto que se lanza como error o se escribe en el
 * log (throw new XError(…), errors.push(…), log(…)) tiene que salir en inglés
 * en las misiones en inglés. Si añades uno nuevo en español, añade su patrón
 * a messagesEn.ts.
 */
function engineMessages(src: string): string[] {
  const out: string[] = []
  const re = /(?:new (?:JsError|StepFailure|ParseError|Error)|errors\.push|\.log|\blog|return)\(\s*(`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g
  for (const m of src.matchAll(re)) {
    const lit = m[1].slice(1, -1).replace(/\$\{[^}]*\}/g, 'X').replace(/\\n/g, '\n').replace(/\\'/g, "'")
    if (SPANISH.test(lit)) out.push(lit)
  }
  return out
}

describe('karate/messagesEn', () => {
  const sources = { runner: runnerSrc, js: jsSrc, parser: parserSrc, pipeline: pipelineSrc, openApi: openApiSrc, payments: paymentsSrc }
  for (const [name, src] of Object.entries(sources)) {
    it(`${name}: every Spanish message has an English translation`, () => {
      const left = engineMessages(src)
        .map((m) => ({ m, en: messageEn(logEn(m)) }))
        .filter(({ en }) => SPANISH.test(en))
        .map(({ m, en }) => `${m}  →  ${en}`)
      expect(left, left.join('\n')).toEqual([])
    })
  }

  it('translates typical runtime errors', () => {
    expect(messageEn('la variable «cuenta» no existe (créala antes con def)')).toBe('variable «cuenta» does not exist (create it first with def)')
    expect(messageEn('línea no reconocida: «given path»  (las palabras clave van con mayúscula: «Given»)')).toContain('unrecognised line')
    expect(messageEn('no se puede leer «id» de un objeto')).toBe('cannot read «id» of an object')
    expect(logEn('[hilo 2]')).toBe('[thread 2]')
  })

  it('leaves English and data untouched', () => {
    expect(messageEn('match failed: EQUALS')).toBe('match failed: EQUALS')
    expect(logEn('{ "holder": "Cuenta de pruebas", "alias": "un objeto" }')).toBe('{ "holder": "Cuenta de pruebas", "alias": "un objeto" }')
  })
})
