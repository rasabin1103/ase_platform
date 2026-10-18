import { describe, expect, it } from 'vitest'
import { getCourse } from '../content/courseList'
import { EXAM_COURSES, studyMissionFor } from './studyMap'

// La lista de misiones exigidas para el certificado la comprueba el backend
// (tests/test_academy_exam_bank.py lee los course.ts del frontend).
describe('simulacro: mapa de repaso', () => {
  it('el mapa de repaso solo apunta a misiones que existen', () => {
    const sections = ['1.1', '1.2', '1.3', '1.4', '1.5', '2.1', '2.2', '2.3', '3.1', '3.2', '4.1', '4.2', '4.3', '4.4', '4.5', '5.1', '5.2', '5.3', '5.4', '5.5', '6.1', '6.2']
    for (const key of Object.keys(EXAM_COURSES)) {
      const ids = getCourse(key)!.missions.map((m) => m.id)
      for (const s of sections) {
        const mission = studyMissionFor(key, s)
        if (mission) expect(ids, `${key} ${s}`).toContain(mission)
      }
    }
    expect(studyMissionFor('qa-profesional', '4.3')).toBe('m03-cobertura')
    expect(studyMissionFor('karate-framework', '4.2')).toBe('m07-mocks')
    for (const s of ['1.1', '1.2', '2.1', '2.2', '2.3', '3.1', '3.2', '4.1', '4.2', '5.1', '5.2']) {
      expect(getCourse('karate-framework')!.missions.map((m) => m.id)).toContain(studyMissionFor('karate-framework', s))
    }
  })
})
