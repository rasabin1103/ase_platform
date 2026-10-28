import { describe, expect, it } from 'vitest'
import { courseProgress, lastTouched, remoteStatus, type MissionStatus } from './courseProgress'
import type { CourseDef } from './engine/types'

const course = {
  key: 'demo',
  title: 'Demo',
  track: 'x',
  level: 'beginner',
  description: '',
  estimatedHours: 1,
  missions: [
    { id: 'm0', title: 'Cero', available: true },
    { id: 'm1', title: 'Uno', available: true },
    { id: 'm2', title: 'Dos', available: true },
    { id: 'm3', title: 'Tres', available: false },
  ],
} as CourseDef

const of = (map: Record<string, MissionStatus>) => (id: string) => map[id] ?? 'new'

describe('courseProgress', () => {
  it('sin progreso propone empezar por la primera misión', () => {
    const p = courseProgress(course, of({}))
    expect(p).toMatchObject({ done: 0, started: 0, total: 4, complete: false })
    expect(p.next).toMatchObject({ index: 0, id: 'm0', status: 'new' })
  })

  it('sigue en la misión a medias, y si hay varias, en la última que se guardó', () => {
    expect(courseProgress(course, of({ m0: 'finished', m1: 'in_progress' })).next?.id).toBe('m1')
    expect(courseProgress(course, of({ m0: 'in_progress', m2: 'in_progress' }), 'm2').next?.id).toBe('m2')
  })

  it('sin misiones a medias propone la primera disponible sin terminar', () => {
    const p = courseProgress(course, of({ m0: 'finished', m1: 'finished' }))
    expect(p).toMatchObject({ done: 2, started: 2 })
    expect(p.next?.id).toBe('m2')
  })

  it('con todas las disponibles terminadas no hay siguiente, pero el curso no está completo hasta tener todas', () => {
    const p = courseProgress(course, of({ m0: 'finished', m1: 'finished', m2: 'finished' }))
    expect(p.next).toBeNull()
    expect(p.complete).toBe(false)
  })

  it('lee el estado y la última misión del progreso guardado', () => {
    expect(remoteStatus(undefined)).toBeNull()
    expect(remoteStatus({ missionId: 'm0', finished: false, actionsCount: 0, updatedAt: '' })).toBe('new')
    expect(remoteStatus({ missionId: 'm0', finished: false, actionsCount: 3, updatedAt: '' })).toBe('in_progress')
    expect(lastTouched([
      { missionId: 'm0', finished: true, actionsCount: 9, updatedAt: '2026-10-01T10:00:00Z' },
      { missionId: 'm2', finished: false, actionsCount: 2, updatedAt: '2026-10-03T10:00:00Z' },
    ])).toBe('m2')
  })
})
