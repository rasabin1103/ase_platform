import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { m06Metricas } from '../../content/courses/qa-profesional/m06-metricas'
import { replay } from '../../engine/engine'
import type { RunState } from '../../engine/types'
import { KobaltoMetricsApp } from './KobaltoMetricsApp'

describe('KobaltoMetricsApp', () => {
  it('muestra el panel y envía el informe de progreso', () => {
    const state = replay(m06Metricas, 1, [{ type: 'start' }])
    const dispatch = vi.fn()
    const props = { state, dispatch, mission: m06Metricas, stateRef: createRef<RunState>() } as unknown as Parameters<typeof KobaltoMetricsApp>[0]
    render(<KobaltoMetricsApp {...props} />)
    expect(screen.getByText('Requisitos con pruebas')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Lecturas' }))
    expect(screen.getByLabelText('Lectura L1')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /informe de progreso/ }))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'app', event: expect.objectContaining({ action: 'submit_progress' }) }))
  })
})
