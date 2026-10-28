import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ currentUser: { uuid: 'x' }, isAuthenticated: true, isLoading: false }) }))
const getAcademyCourseSeries = vi.fn()
vi.mock('./api', async (orig) => ({ ...(await orig<typeof import('./api')>()), getAcademyCourseSeries: (k: string) => getAcademyCourseSeries(k) }))

const { CourseSeries } = await import('./CourseSeries')

const base = { catalogType: 'course', catalogStatus: 'published', titleEn: null, currency: 'EUR', missionsStarted: 0, missionsFinished: 0, isCurrent: false, hasAccess: false }

function renderSeries() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CourseSeries courseKey="sql-intermedio" lang="es" />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('CourseSeries', () => {
  beforeEach(() => getAcademyCourseSeries.mockReset())

  it('muestra todos los cursos de la serie, empezados o no, con su acceso', async () => {
    getAcademyCourseSeries.mockResolvedValue({
      courseKey: 'sql-intermedio',
      seriesName: 'Ruta SQL',
      items: [
        { ...base, catalogSlug: 'sql-desde-cero', courseKey: 'sql-iniciacion', title: 'SQL desde cero', seriesOrder: 1, price: 0, isFree: true, hasAccess: true, missionsStarted: 3, missionsFinished: 2 },
        { ...base, catalogSlug: 'sql-intermedio', courseKey: 'sql-intermedio', title: 'SQL intermedio', seriesOrder: 2, price: '39.00', isFree: false, isCurrent: true },
        { ...base, catalogSlug: 'sql-avanzado', courseKey: null, title: 'SQL avanzado', seriesOrder: 3, price: '49.00', isFree: false, catalogStatus: 'coming_soon' },
      ],
    })
    renderSeries()
    expect(await screen.findByText('Serie: Ruta SQL')).toBeInTheDocument()
    expect(screen.getByText('Has empezado 1 de 3 cursos')).toBeInTheDocument()
    expect(screen.getByText('En curso · 2/11 misiones')).toBeInTheDocument()
    expect(screen.getByText('Sin empezar')).toBeInTheDocument()
    expect(screen.getByText('Próximamente')).toBeInTheDocument()
    expect(screen.getByText('Estás aquí ·')).toBeInTheDocument()
    expect(screen.getByText('Tienes acceso')).toBeInTheDocument()
    expect(screen.getByText(/De pago · 39,00/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /SQL desde cero/ })).toHaveAttribute('href', '/academy/sql-iniciacion')
  })

  it('no se muestra si el curso no está en una serie', async () => {
    getAcademyCourseSeries.mockResolvedValue({ courseKey: 'sql-intermedio', seriesName: null, items: [] })
    const { container } = renderSeries()
    await vi.waitFor(() => expect(getAcademyCourseSeries).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
