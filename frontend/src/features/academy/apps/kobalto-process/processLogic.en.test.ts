import { describe, expect, it } from 'vitest'
import { ACTIVITIES, INITIAL_PROCESS, activitiesFor, askLaura, propose, sendTrace, setActivity, setLink, testwareFor, type ActivityId, type ProcessState } from './processLogic'

const ORDER: ActivityId[] = ['planning', 'monitoring', 'analysis', 'design', 'implementation', 'execution', 'completion']
const TW: Record<ActivityId, string> = { planning: 'plan', monitoring: 'progress', analysis: 'conditions', design: 'cases', implementation: 'procedures', execution: 'logs', completion: 'closure' }

describe('test process · English', () => {
  it('uses ISTQB activity and testware names with the same ids', () => {
    expect(activitiesFor('en').map((a) => a.id)).toEqual(ACTIVITIES.map((a) => a.id))
    expect(activitiesFor('en').find((a) => a.id === 'monitoring')!.label).toBe('Test monitoring and control')
    expect(testwareFor('en').find((t) => t.id === 'closure')!.label).toBe('Test completion report and lessons learned')
  })

  it('proposal and traceability give the same flags in both languages', () => {
    let s: ProcessState = INITIAL_PROCESS
    ORDER.forEach((id, i) => {
      s = setActivity(s, id, { position: i + 1, testware: TW[id], role: ['planning', 'monitoring', 'completion'].includes(id) ? 'management' : 'tester' }, 'en').state
    })
    s = setLink(s, 'C1', 'H1', 'en').state
    const en = propose(s, 'en')
    expect(en.event.flags).toEqual(propose(s).event.flags)
    expect(en.event.flags).toContain('proc.all')
    expect(en.event.summary).toMatch(/^Process proposal sent to Raúl: order consistent/)
    expect(sendTrace(s, 'en').event.flags).toEqual(sendTrace(s).event.flags)
    expect(askLaura(s, 'en').event.summary).toContain('traceability matrix has 10 links missing or wrong')
    expect(askLaura(INITIAL_PROCESS, 'en').state.feedback![0]).toBe('Some activities have no position in the process.')
  })
})
