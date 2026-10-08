import { describe, expect, it } from 'vitest'
import { m01HistoriaAmbigua as mission } from '../content/courses/testing-fundamentals/m01-historia-ambigua'
import { m01Design } from '../content/courses/testing-fundamentals/m01-design'
import { INITIAL_SCHEDULE, schedule } from '../apps/kobalto-scheduled/scheduleLogic'
import { replay, step, summarize, toolStatus } from './engine'
import { reviewSummary } from './review'
import type { Action, IssueType } from './types'

const mark = (fragmentId: string, issue: IssueType): Action => ({ type: 'reviewMark', fragmentId, issue })

describe('misión 1 · la historia ambigua', () => {
  it('revisar y enviar dudas aclara el ticket y responde la PO', () => {
    const s = replay(mission, 1, [{ type: 'start' }, mark('f1', 'incomplete'), mark('f9', 'ambiguous'), { type: 'reviewSubmit' }])
    expect(s.flags['clar.date']).toBe(true)
    expect(s.reviewResults.f9.correct).toBe(false)
    const reply = s.messages.at(-1)!
    expect(reply.from).toBe('marta')
    expect(reply.body).toContain('Desde mañana')
    expect(reply.body).toContain('igual que en las transferencias normales')
    expect(s.clock).toBe(10)
  })

  it('lo aclarado antes de las 11:30 evita bugs; lo demás llega al prototipo', () => {
    const s = replay(mission, 1, [
      { type: 'start' },
      mark('f1', 'incomplete'),
      mark('f7', 'contradictory'),
      { type: 'reviewSubmit' },
      { type: 'wait', minutes: 30 },
      { type: 'wait', minutes: 150 },
    ])
    expect(s.flags['dev.started']).toBe(true)
    expect(s.preventedBugs.sort()).toEqual(['M1-B1', 'M1-B5'])
    expect(s.activeBugs).toEqual(expect.arrayContaining(['M1-B2', 'M1-B3', 'M1-B4', 'M1-B6']))
    const rs = reviewSummary(mission, s)!
    expect(rs.total).toBe(8)
    expect(rs.found).toBe(2)
    expect(rs.prevented).toHaveLength(2)
    expect(summarize(mission, s).bugs.map((b) => b.id)).not.toContain('M1-B1')
  })

  it('aclarar después del inicio del desarrollo ya no evita el bug', () => {
    let s = replay(mission, 1, [{ type: 'start' }, { type: 'wait', minutes: 30 }])
    s = step(mission, s, { type: 'choose', messageId: s.messages.find((m) => m.sceneId === 'refinement')!.id, choiceId: 'all_clear' })
    s = step(mission, s, { type: 'wait', minutes: 150 })
    s = step(mission, s, mark('f1', 'incomplete'))
    s = step(mission, s, { type: 'reviewSubmit' })
    expect(s.flags['clar.date']).toBe(true)
    expect(s.activeBugs).toContain('M1-B1')
    expect(s.preventedBugs).toEqual([])
  })

  it('el prototipo solo se abre a las 14:30', () => {
    let s = replay(mission, 1, [{ type: 'start' }])
    expect(toolStatus(mission, s, 'app')).toBe('locked')
    s = step(mission, s, { type: 'endDay' })
    expect(toolStatus(mission, s, 'app')).toBe('enabled')
  })

  it('el diseño de pruebas conoce los bugs del prototipo', () => {
    const all = ['M1-B1', 'M1-B2', 'M1-B3', 'M1-B4', 'M1-B5', 'M1-B6']
    expect(m01Design.reveals?.('exec_date', '0', all)).toBe('M1-B1')
    expect(m01Design.reveals?.('exec_date', '0', [])).toBeUndefined()
    expect(m01Design.reveals?.('monthly_day', '31', all)).toBe('M1-B2')
    expect(m01Design.reveals?.('amount', '7000', all)).toBe('M1-B3')
    expect(m01Design.reveals?.('cancel', 'recurrente – próxima', all)).toBe('M1-B4')
    expect(m01Design.reveals?.('destination', 'terceros', all)).toBe('M1-B5')
    expect(m01Design.reveals?.('end_date', '-1', all)).toBe('M1-B6')
    expect(m01Design.classify('exec_date', '11')).toEqual(['within', 'weekend'])
    expect(m01Design.expected('exec_date', '365')).toBe(true)
    expect(m01Design.expected('exec_date', '366')).toBe(false)
  })

  it('un bug de requisito sin aclarar se discute; aclarado, se acepta', () => {
    const report = (evidence: number[]) => ({
      title: 'Se puede programar una transferencia para hoy',
      steps: '1. Programadas\n2. Fecha de hoy\n3. Programar',
      expected: 'Error: la fecha debe ser a partir de mañana',
      actual: 'Se programa sin error',
      severity: 'high' as const,
      evidence,
    })
    const ev = schedule(INITIAL_SCHEDULE, {
      iban: 'ES8491010001150300067890',
      beneficiary: 'Yo',
      amount: '50',
      date: '2026-10-06',
      frequency: 'once',
      endDate: '',
    }).event
    let s = replay(mission, 1, [{ type: 'start' }, { type: 'wait', minutes: 330 }])
    s = step(mission, s, { type: 'app', event: ev })
    const disputed = step(mission, s, { type: 'report', report: report([s.log.at(-1)!.id]) })
    expect(disputed.reports.at(-1)!.status).toBe('disputed')
    s = step(mission, s, mark('f1', 'incomplete'))
    s = step(mission, s, { type: 'reviewSubmit' })
    s = step(mission, s, { type: 'report', report: report([s.log.at(-1)!.id]) })
    expect(s.reports.at(-1)!.status).toBe('accepted')
  })
})
