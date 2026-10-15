import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExamAttempt } from './examApi'
import { formatClock } from './studyMap'

const saveExamAnswers = vi.fn()
const submitExam = vi.fn()
vi.mock('./examApi', () => ({
  saveExamAnswers: (...args: unknown[]) => saveExamAnswers(...args),
  submitExam: (...args: unknown[]) => submitExam(...args),
}))

const { ExamRunner } = await import('./ExamRunner')

function attempt(minutesLeft = 60): ExamAttempt {
  const now = Date.now()
  return {
    id: 'a1',
    courseKey: 'qa-profesional',
    title: 'Simulacro de examen CTFL v4.0',
    status: 'in_progress',
    startedAt: new Date(now).toISOString(),
    deadlineAt: new Date(now + minutesLeft * 60_000).toISOString(),
    submittedAt: null,
    serverNow: new Date(now).toISOString(),
    extendedTime: false,
    total: 2,
    passMark: 1,
    result: null,
    questions: [1, 2].map((n) => ({
      id: `c1-0${n}`,
      number: n,
      chapter: 1,
      section: '1.1',
      sectionTitle: 'Qué es probar',
      k: 1,
      text: `Pregunta ${n}`,
      code: null,
      options: ['Uno', 'Dos', 'Tres', 'Cuatro'],
      selected: null,
      correct: null,
      isCorrect: null,
      explanation: null,
    })),
  }
}

describe('ExamRunner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    saveExamAnswers.mockReset().mockResolvedValue({ ...attempt(), status: 'in_progress' })
    submitExam.mockReset().mockResolvedValue({ ...attempt(), status: 'submitted' })
  })
  afterEach(() => vi.useRealTimers())

  it('autoguarda la respuesta y entrega con confirmación', async () => {
    const onFinished = vi.fn()
    render(<ExamRunner courseKey="qa-profesional" attempt={attempt()} onFinished={onFinished} />)
    expect(screen.getByText('Pregunta 1')).toBeTruthy()
    fireEvent.click(screen.getByText('Dos'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800)
    })
    expect(saveExamAnswers).toHaveBeenCalledWith('qa-profesional', 'a1', { 'c1-01': 1 }, 'es')
    expect(screen.getByText(/1 de 2 respondidas/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /Entregar/ }))
    expect(screen.getByText(/Te quedan 1 preguntas sin responder/)).toBeTruthy()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Entregar y ver resultado/ }))
    })
    expect(submitExam).toHaveBeenCalledWith('qa-profesional', 'a1', { 'c1-01': 1 }, 'es')
    expect(onFinished).toHaveBeenCalledTimes(1)
  })

  it('entrega sola cuando se acaba el tiempo', async () => {
    const onFinished = vi.fn()
    render(<ExamRunner courseKey="qa-profesional" attempt={attempt(0.05)} onFinished={onFinished} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })
    expect(submitExam).toHaveBeenCalledTimes(1)
    expect(onFinished).toHaveBeenCalledTimes(1)
  })

  it('formatea el reloj', () => {
    expect(formatClock(61_000)).toBe('01:01')
    expect(formatClock(-5)).toBe('00:00')
  })
})
