import { describe, expect, it } from 'vitest'
import { INITIAL_SCHEDULE, SCHEDULE_BUGS as B, cancel, executions, schedule, type ScheduleForm } from './scheduleLogic'

const form = (over: Partial<ScheduleForm> = {}): ScheduleForm => ({
  iban: 'ES3091010001120200012345',
  beneficiary: 'Casero',
  amount: '650',
  date: '2026-10-20',
  frequency: 'once',
  endDate: '',
  ...over,
})
const none: string[] = []

describe('transferencias programadas', () => {
  it('una programación correcta no manifiesta bugs', () => {
    const r = schedule(INITIAL_SCHEDULE, form(), { active: none })
    expect(r.ok).toBe(true)
    expect(r.event.bugs).toEqual([])
  })

  it('M1-B1: acepta fechas de hoy o pasadas', () => {
    expect(schedule(INITIAL_SCHEDULE, form({ date: '2026-10-06' }), { active: none }).ok).toBe(false)
    const r = schedule(INITIAL_SCHEDULE, form({ date: '2026-10-01' }), { active: [B.pastDate] })
    expect(r.ok).toBe(true)
    expect(r.event.bugs).toContain(B.pastDate)
  })

  it('mensual el día 31: la especificación usa el último día del mes; el bug salta meses', () => {
    const spec = executions({ date: '2026-10-31', frequency: 'monthly', endDate: '' }, false)
    expect(spec[1]).toBe('2026-11-30')
    const r = schedule(INITIAL_SCHEDULE, form({ date: '2026-10-31', frequency: 'monthly' }), { active: [B.monthlySkips] })
    expect(r.event.bugs).toContain(B.monthlySkips)
    expect(r.scheduled?.executions[1]).toBe('2026-12-31')
  })

  it('M1-B3: no valida el máximo de 5.000 € al programar', () => {
    expect(schedule(INITIAL_SCHEDULE, form({ amount: '7000' }), { active: none }).ok).toBe(false)
    expect(schedule(INITIAL_SCHEDULE, form({ amount: '7000' }), { active: [B.noLimitAtSchedule] }).event.bugs).toContain(B.noLimitAtSchedule)
  })

  it('M1-B5: solo permite cuentas propias', () => {
    const r = schedule(INITIAL_SCHEDULE, form(), { active: [B.ownAccountsOnly] })
    expect(r.ok).toBe(false)
    expect(r.event.bugs).toContain(B.ownAccountsOnly)
    expect(schedule(INITIAL_SCHEDULE, form({ iban: 'ES8491010001150300067890' }), { active: [B.ownAccountsOnly] }).ok).toBe(true)
  })

  it('M1-B6: acepta fecha de fin anterior a la de inicio', () => {
    const f = form({ frequency: 'weekly', endDate: '2026-10-10' })
    expect(schedule(INITIAL_SCHEDULE, f, { active: none }).ok).toBe(false)
    expect(schedule(INITIAL_SCHEDULE, f, { active: [B.endBeforeStart] }).event.bugs).toContain(B.endBeforeStart)
  })

  it('M1-B4: cancelar una recurrente borra toda la serie sin preguntar', () => {
    const st = schedule(INITIAL_SCHEDULE, form({ frequency: 'weekly' }), { active: none }).state
    const ok = cancel(st, 1, 'next', { active: none })
    expect(ok.state.scheduled[0].executions).toHaveLength(3)
    const bad = cancel(st, 1, 'next', { active: [B.cancelWholeSeries] })
    expect(bad.state.scheduled).toHaveLength(0)
    expect(bad.event.bugs).toContain(B.cancelWholeSeries)
  })

  it('fin de semana: se ejecuta el lunes siguiente', () => {
    expect(executions({ date: '2026-10-17', frequency: 'once', endDate: '' }, false)).toEqual(['2026-10-19'])
  })
})
