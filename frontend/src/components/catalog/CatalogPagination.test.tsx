import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CatalogPagination } from './CatalogPagination'
import { visiblePages } from './catalogPagination.utils'

const labels = { nav: 'Páginas', previous: 'Anterior', next: 'Siguiente', showing: '{{from}}–{{to}} de {{total}}', page: 'Página {{page}}' }

describe('paginación del catálogo', () => {
  it('muestra todas las páginas si son pocas y recorta con «…» si son muchas', () => {
    expect(visiblePages(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(visiblePages(6, 12)).toEqual([1, 'gap', 4, 5, 6, 7, 8, 'gap', 12])
    expect(visiblePages(1, 12)).toEqual([1, 2, 3, 'gap', 12])
    // Un hueco de una sola página se muestra como número, no como «…».
    expect(visiblePages(4, 12)).toEqual([1, 2, 3, 4, 5, 6, 'gap', 12])
  })

  it('indica el rango, marca la página actual y avisa al cambiar', () => {
    const onPageChange = vi.fn()
    render(<CatalogPagination page={2} pageSize={12} total={30} onPageChange={onPageChange} labels={labels} />)
    expect(screen.getByText('13–24 de 30')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    fireEvent.click(screen.getByRole('button', { name: 'Página 1' }))
    expect(onPageChange.mock.calls).toEqual([[3], [1]])
  })

  it('en la última página no se puede avanzar, y con una sola página solo se ve el recuento', () => {
    const { rerender } = render(<CatalogPagination page={3} pageSize={12} total={30} onPageChange={() => {}} labels={labels} />)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(screen.getByText('25–30 de 30')).toBeInTheDocument()
    rerender(<CatalogPagination page={1} pageSize={12} total={7} onPageChange={() => {}} labels={labels} />)
    expect(screen.getByText('1–7 de 7')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })
})
