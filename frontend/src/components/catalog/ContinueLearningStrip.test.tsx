import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../i18n'

vi.mock('../../api/consumerCatalog.api', () => ({
  listMyRecentlyOpened: async () => ({
    items: [
      { slug: 'sql-desde-cero', type: 'course', title: 'SQL desde cero', titleEn: null, imageUrl: null, academyCourseKey: 'sql-iniciacion' },
      { slug: 'guia-qa', type: 'resource', title: 'Guía de QA', titleEn: null, imageUrl: null, academyCourseKey: null },
    ],
  }),
}))
vi.mock('../../features/academy/api', async (orig) => ({
  ...(await orig<typeof import('../../features/academy/api')>()),
  listAcademyRuns: async () => [
    { missionId: 'm00-primera-consulta', finished: true, actionsCount: 20, updatedAt: '2026-10-01T10:00:00Z' },
    { missionId: 'm01-filtrar', finished: false, actionsCount: 4, updatedAt: '2026-10-02T10:00:00Z' },
  ],
}))
vi.mock('../ui/AuthenticatedImage', () => ({ AuthenticatedImage: () => null }))

const { ContinueLearningStrip } = await import('./ContinueLearningStrip')

describe('ContinueLearningStrip', () => {
  it('un curso de ASE Academy vuelve a la misión a medias y muestra el progreso', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <I18nProvider>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <ContinueLearningStrip />
          </MemoryRouter>
        </QueryClientProvider>
      </I18nProvider>,
    )
    expect(await screen.findByText(/1\/11 (misiones|missions)/)).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/academy/sql-iniciacion/m01-filtrar')
    expect(links[1]).toHaveAttribute('href', '/catalog/resource/guia-qa')
  })
})
