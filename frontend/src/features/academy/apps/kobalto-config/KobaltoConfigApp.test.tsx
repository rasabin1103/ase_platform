import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { m07Configuracion } from '../../content/courses/qa-profesional/m07-configuracion'
import { replay } from '../../engine/engine'
import type { RunState } from '../../engine/types'
import { KobaltoConfigApp } from './KobaltoConfigApp'

describe('KobaltoConfigApp', () => {
  it('muestra el comparador y envía el análisis', () => {
    const state = replay(m07Configuracion, 1, [{ type: 'start' }])
    const dispatch = vi.fn()
    const props = { state, dispatch, mission: m07Configuracion, stateRef: createRef<RunState>() } as unknown as Parameters<typeof KobaltoConfigApp>[0]
    render(<KobaltoConfigApp {...props} />)
    expect(screen.getByText('round: down')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Mantenimiento' }))
    expect(screen.getByText(/Regresión seleccionada: 0 días/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Enviar el análisis/ }))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'app', event: expect.objectContaining({ action: 'submit' }) }))
  })
})
