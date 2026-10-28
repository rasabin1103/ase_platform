import { describe, expect, it } from 'vitest'
import type { Mission } from '../../../../engine/types'
import { MISSIONS_ES } from '../../../registry'
import { TEXT_KEYS, diff } from '../../../i18nDiff'

/**
 * SQL course in English: every Mission exported by a file of this folder is
 * compared with its Spanish twin (same id). Runs on whatever is already
 * translated, so each mission can be checked on its own:
 *   npx vitest run src/features/academy/content/courses/sql-iniciacion/en/parity.test.ts -t m03
 */
const modules = import.meta.glob<Record<string, unknown>>('./m*.ts', { eager: true })
const missions: Mission[] = Object.values(modules).flatMap((m) =>
  Object.values(m).filter((v): v is Mission => !!v && typeof v === 'object' && 'courseKey' in v && 'scenes' in v),
)

// Spanish words that should not survive in the English text (names and
// places are fine: they never contain these words on their own).
const SPANISH = /(^|[^\p{L}])(el|los|las|que|para|con|una|del|está|también|porque|cuando|pero|como|tienes|puedes|hoy|mañana|ayer|qué|cómo|dónde|sí)(?=[^\p{L}]|$)|[¿¡]/iu

function spanishLeftovers(v: unknown, path: string, textual: boolean, out: string[]) {
  if (typeof v === 'string') {
    // Código SQL y nombres de columna (con_concepto, cuenta_origen_id…) se quedan en español.
    const prose = v.replace(/`[^`]*`/g, ' ').replace(/\b\w*_\w*\b/g, ' ')
    if (textual && SPANISH.test(prose)) out.push(`${path}: «${v.slice(0, 90)}»`)
    return
  }
  if (Array.isArray(v)) return v.forEach((x, i) => spanishLeftovers(x, `${path}[${i}]`, textual, out))
  if (v && typeof v === 'object' && !(v instanceof Function))
    for (const [k, x] of Object.entries(v)) {
      if (k === 'world' || k === 'files' || k === 'rows') continue
      spanishLeftovers(x, `${path}.${k}`, textual || TEXT_KEYS.has(k), out)
    }
}

describe('SQL course in English', () => {
  for (const en of missions) {
    describe(en.id, () => {
      it(`${en.id}: same structure as the Spanish mission`, () => {
        const es = MISSIONS_ES.find((m) => m.courseKey === en.courseKey && m.id === en.id)
        expect(es, 'no Spanish mission with this id').toBeDefined()
        expect(en.lang).toBe('en')
        const out: string[] = []
        diff(es, en, en.id, false, out)
        expect(out, out.join('\n')).toEqual([])
      })
      it(`${en.id}: no Spanish left in the texts`, () => {
        const out: string[] = []
        spanishLeftovers(en, en.id, false, out)
        expect(out, out.join('\n')).toEqual([])
      })
    })
  }
})
