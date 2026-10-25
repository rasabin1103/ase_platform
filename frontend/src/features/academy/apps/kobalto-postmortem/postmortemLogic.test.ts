import { describe, expect, it } from 'vitest'
import { ACTIONS, CAUSES, INITIAL_PM, savePostmortem, toggleAction, toggleCause, type PostmortemState } from './postmortemLogic'

const GOOD_C = CAUSES.filter((c) => c.good).map((c) => c.id)
const GOOD_A = ACTIONS.filter((a) => a.good).map((a) => a.id)
function pm(causes: string[], actions: string[]) {
  let s: PostmortemState = INITIAL_PM
  for (const c of causes) s = toggleCause(s, c).state
  for (const a of actions) s = toggleAction(s, a).state
  return s
}

describe('app Postmortem (curso 4 · misión 10)', () => {
  it('causas de sistema y una acción para cada una', () => {
    const r = savePostmortem(pm(GOOD_C, GOOD_A))
    expect(r.event.cost).toBe(30)
    expect(r.event.flags).toEqual(['pm.saved', 'pm.causes', 'pm.actions', 'pm.ok'])
  })

  it('señalar a una persona como causa es buscar culpables', () => {
    const flags = savePostmortem(pm([...GOOD_C, 'pablo'], GOOD_A)).event.flags
    expect(flags).toEqual(['pm.saved', 'pm.actions', 'pm.blame'])
  })

  it('la doble firma o la sanción no son acciones de sistema', () => {
    expect(savePostmortem(pm(GOOD_C, [...GOOD_A, 'double_signoff'])).event.flags).toEqual(['pm.saved', 'pm.causes'])
    expect(savePostmortem(pm(GOOD_C, ['sanction'])).event.flags).not.toContain('pm.ok')
  })

  it('no se guarda vacío ni se cambia después', () => {
    expect(savePostmortem(pm(GOOD_C, [])).event.action).toBe('noop')
    const s = savePostmortem(pm(GOOD_C, GOOD_A)).state
    expect(toggleCause(s, 'dev').event.action).toBe('noop')
  })
})
