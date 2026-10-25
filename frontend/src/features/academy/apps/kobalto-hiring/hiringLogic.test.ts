import { describe, expect, it } from 'vitest'
import { CANDIDATES, INITIAL_HIRING, REQUIREMENTS, chooseStep, decide, saveProfile, submitDecisions, toggleRequirement, type Decision, type HiringState, type Step } from './hiringLogic'

const GOOD_REQ = REQUIREMENTS.filter((r) => r.good).map((r) => r.id)
const GOOD_STEPS = { format: 'structured', process: 'fast' } as const
const BEST = Object.fromEntries(CANDIDATES.map((c) => [c.id, c.best])) as Record<string, Decision>

function profile(reqs: string[] = GOOD_REQ, steps: Record<Step['id'], string> = GOOD_STEPS) {
  let s: HiringState = INITIAL_HIRING
  for (const r of reqs) s = toggleRequirement(s, r).state
  for (const [k, v] of Object.entries(steps)) s = chooseStep(s, k as Step['id'], v).state
  return s
}
function decideAll(s: HiringState, d: Record<string, Decision>) {
  for (const [id, v] of Object.entries(d)) s = decide(s, id, v).state
  return submitDecisions(s)
}

describe('app Contratación (curso 4 · misión 8)', () => {
  it('perfil desde lo que falta, entrevista estructurada y proceso corto', () => {
    const r = saveProfile(profile())
    expect(r.event.cost).toBe(10)
    expect(r.event.flags).toEqual(['profile.saved', 'profile.ok', 'interview.structured', 'process.ready'])
  })

  it('un requisito de título o «encaje» estropea el perfil', () => {
    expect(saveProfile(profile([...GOOD_REQ, 'fit'])).event.flags).toEqual(['profile.saved', 'interview.structured'])
    expect(saveProfile(profile(GOOD_REQ, { format: 'chat', process: 'fast' })).event.flags).toEqual(['profile.saved', 'profile.ok'])
  })

  it('no se decide sin perfil publicado ni con más contrataciones que vacantes', () => {
    expect(decideAll(INITIAL_HIRING, BEST).event.action).toBe('noop')
    const s = saveProfile(profile()).state
    expect(decideAll(s, { ...BEST, marcos: 'hire' }).event.action).toBe('noop')
  })

  it('la decisión que respalda la tarjeta: Ana, Javier y Rocío', () => {
    const r = decideAll(saveProfile(profile()).state, BEST)
    expect(r.event.cost).toBe(15)
    expect(r.event.flags).toEqual(['hiring.decided', 'hiring.ok', 'reject.marcos', 'hire.ana', 'hire.javier', 'hire.rocio', 'reject.luis'])
  })

  it('cambiar a Rocío por Marcos no cubre lo que falta', () => {
    const flags = decideAll(saveProfile(profile()).state, { ...BEST, rocio: 'no', marcos: 'hire' }).event.flags
    expect(flags).toContain('hire.marcos')
    expect(flags).not.toContain('hiring.ok')
  })
})
