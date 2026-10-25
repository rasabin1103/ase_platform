import { describe, expect, it } from 'vitest'
import { INITIAL_PREP, chooseStep, savePrep, toggleExample, type PrepState, type Step } from './oneOnOneLogic'

function prep(examples: string[], script: Record<Step['id'], string>) {
  let s: PrepState = INITIAL_PREP
  for (const e of examples) s = toggleExample(s, e).state
  for (const [k, v] of Object.entries(script)) s = chooseStep(s, k as Step['id'], v).state
  return s
}
const FACTS = ['sprint', 'plan', 'daily']
const GOOD = { opening: 'sbi', explore: 'ask', plan: 'smart', record: 'shared' } as const

describe('app 1:1 (curso 4 · misión 7)', () => {
  it('tres hechos y un guion bien planteado: preparación lista', () => {
    const r = savePrep(prep(FACTS, GOOD))
    expect(r.event.cost).toBe(20)
    expect(r.event.flags).toEqual(['prep.saved', 'prep.examples', 'prep.plan', 'prep.record', 'prep.ready'])
  })

  it('una opinión de otra persona o un juicio estropean los ejemplos', () => {
    const flags = savePrep(prep(['sprint', 'plan', 'hearsay'], GOOD)).event.flags
    expect(flags).not.toContain('prep.examples')
    expect(flags).not.toContain('prep.ready')
    expect(flags).toContain('prep.plan')
  })

  it('como mucho tres ejemplos', () => {
    const s = prep(FACTS, GOOD)
    expect(toggleExample(s, 'judgment').event.action).toBe('noop')
    expect(toggleExample(s, 'sprint').state.examples).toEqual(['plan', 'daily'])
  })

  it('con buenos ejemplos pero abriendo con la amenaza no está lista', () => {
    const flags = savePrep(prep(FACTS, { ...GOOD, opening: 'threat' })).event.flags
    expect(flags).toContain('prep.examples')
    expect(flags).not.toContain('prep.ready')
  })

  it('no se guarda incompleta', () => {
    expect(savePrep(prep(FACTS, { opening: 'sbi' } as Record<Step['id'], string>)).event.action).toBe('noop')
  })
})
