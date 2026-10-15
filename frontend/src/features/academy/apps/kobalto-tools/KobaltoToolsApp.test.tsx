import { fireEvent, render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { m08Herramientas } from '../../content/courses/qa-profesional/m08-herramientas'
import { replay } from '../../engine/engine'
import type { RunState } from '../../engine/types'
import { KobaltoToolsApp } from './KobaltoToolsApp'

describe('KobaltoToolsApp', () => {
  it('muestra las necesidades y las candidatas y envía la propuesta', () => {
    const state = replay(m08Herramientas, 1, [{ type: 'start' }])
    const dispatch = vi.fn()
    const props = { state, dispatch, mission: m08Herramientas, stateRef: createRef<RunState>() } as unknown as Parameters<typeof KobaltoToolsApp>[0]
    render(<KobaltoToolsApp {...props} />)
    expect(screen.getByLabelText('Categoría de N1')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'Candidatas' }))
    expect(screen.getByText('TestForge Pro')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Enviar la propuesta/ }))
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'app', event: expect.objectContaining({ action: 'submit' }) }))
  })
})
