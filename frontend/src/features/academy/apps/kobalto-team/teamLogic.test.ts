import { describe, expect, it } from 'vitest'
import { INITIAL_TEAM, TASKS, TOPICS, assign, confirmAssignments, prepareOneOnOne, toggleTopic, type PersonId, type TeamState } from './teamLogic'

const assignAll = (map: Record<string, PersonId>) => {
  let s: TeamState = INITIAL_TEAM
  for (const [task, person] of Object.entries(map)) s = assign(s, task, person).state
  return s
}

describe('app Equipo (curso 4 · misión 6)', () => {
  it('el reparto adecuado activa assign.ok y los flags de cada persona', () => {
    const s = assignAll(Object.fromEntries(TASKS.map((t) => [t.id, t.best])))
    const r = confirmAssignments(s)
    expect(r.event.cost).toBe(15)
    expect(r.event.flags).toEqual(expect.arrayContaining(['assign.submitted', 'assign.ok', 'assign.hector', 'assign.sergio', 'assign.lucia']))
  })

  it('no se puede confirmar con tareas sin asignar', () => {
    const s = assign(INITIAL_TEAM, 't1', 'hector').state
    expect(confirmAssignments(s).event.cost).toBe(0)
  })

  it('coger tú lo crítico, darle lo crítico a la junior o cargar más a Pablo se detecta', () => {
    const self = confirmAssignments(assignAll({ t1: 'yo', t2: 'sergio', t3: 'lucia', t4: 'nerea', t5: 'pablo' })).event.flags
    expect(self).toContain('assign.self')
    expect(self).not.toContain('assign.ok')
    const junior = confirmAssignments(assignAll({ t1: 'lucia', t2: 'sergio', t3: 'hector', t4: 'pablo', t5: 'nerea' })).event.flags
    expect(junior).toEqual(expect.arrayContaining(['assign.junior_critical', 'assign.pablo_more']))
  })

  it('el 1:1 está preparado con tres temas adecuados y ninguno a evitar', () => {
    let s: TeamState = INITIAL_TEAM
    for (const id of ['elephant', 'growth', 'feedback', 'needs']) s = toggleTopic(s, id).state
    expect(prepareOneOnOne(s).event.flags).toEqual(['one2one.prepped', 'one2one.ready', 'one2one.elephant'])
    let b: TeamState = INITIAL_TEAM
    for (const id of ['growth', 'feedback', 'needs', 'boss']) b = toggleTopic(b, id).state
    expect(prepareOneOnOne(b).event.flags).toEqual(['one2one.prepped'])
  })

  it('como mucho cuatro temas, y la mitad de las opciones son a evitar', () => {
    let s: TeamState = INITIAL_TEAM
    for (const t of TOPICS) s = toggleTopic(s, t.id).state
    expect(s.topics).toHaveLength(4)
    expect(TOPICS.filter((t) => t.good)).toHaveLength(4)
  })
})
