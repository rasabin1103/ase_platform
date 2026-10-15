import { describe, expect, it } from 'vitest'
import { m01HistoriaAmbigua } from '../content/courses/testing-fundamentals/m01-historia-ambigua'
import { replay, summarize } from './engine'
import { reviewMessage } from './design'
import type { Action, Mission } from './types'

const en: Mission = { ...m01HistoriaAmbigua, lang: 'en' }
const report: Action = {
  type: 'report',
  report: { title: 'x', steps: '', expected: '', actual: '', severity: 'low', evidence: [] },
}

describe('engine texts follow the mission language', () => {
  it('requirements review reply is in English for an English mission', () => {
    const s = replay(en, 1, [{ type: 'start' }, { type: 'reviewMark', fragmentId: 'f1', issue: 'incomplete' }, { type: 'reviewSubmit' }])
    const reply = s.messages.at(-1)!.body
    expect(reply).toContain('Thanks for the review!')
    expect(reply).toContain('Here are my answers point by point')
    expect(reply).not.toContain('Gracias')
  })

  it('bug report review feedback and reviewer reply are in English', () => {
    const s = replay(en, 1, [{ type: 'start' }, report])
    expect(s.reports[0].status).toBe('rejected')
    expect(s.reports[0].feedback[0]).toBe('You did not attach any evidence: without it nobody can reproduce the problem.')
    expect(s.messages.at(-1)!.body).toMatch(/^Closing .+: I don't see the failure in the evidence you attached\.$/)
  })

  it('Spanish missions keep the Spanish texts', () => {
    const s = replay(m01HistoriaAmbigua, 1, [{ type: 'start' }, report])
    expect(s.reports[0].feedback[0]).toBe('No has adjuntado evidencia: sin ella nadie puede reproducir el problema.')
    expect(s.messages.at(-1)!.body).toContain('no veo el fallo en la evidencia que adjuntas')
  })

  it('default verdicts and notes are in English', () => {
    const mission: Mission = { ...en, verdicts: undefined }
    const s = replay(mission, 1, [{ type: 'start' }, { type: 'endDay' }])
    expect(['Day passed with flying colors', 'Day passed', 'A tough day']).toContain(summarize(mission, s).verdict.title)
    for (const n of s.notes) expect(n.text).not.toMatch(/Te perdiste/)
  })

  it('design review message is in English', () => {
    if (!en.testDesign) return
    const s = replay(en, 1, [{ type: 'start' }])
    expect(reviewMessage(en, s, 1)).toMatch(/^I don't see any cases in your design yet/)
  })
})
