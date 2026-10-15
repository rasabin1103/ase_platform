import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../../i18n'

const verifyCertificate = vi.fn()
vi.mock('../exam/examApi', () => ({
  verifyCertificate: (...args: unknown[]) => verifyCertificate(...args),
  certificatePdfUrl: (code: string, lang: string) => `/api/v1/academy/certificates/verify/${code}/pdf?lang=${lang}`,
}))

const { AcademyCertificatePage } = await import('./AcademyCertificatePage')

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nProvider>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/academy/certificado/ABC123']}>
          <Routes>
            <Route path="/academy/certificado/:code" element={<AcademyCertificatePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nProvider>,
  )
}

describe('AcademyCertificatePage', () => {
  beforeEach(() => {
    verifyCertificate.mockReset().mockResolvedValue({
      code: 'ABC123',
      courseKey: 'qa-profesional',
      courseTitle: 'Professional QA',
      holderName: 'Ada Lovelace',
      score: 32,
      total: 40,
      issuedAt: '2026-10-01T10:00:00Z',
    })
  })
  afterEach(() => localStorage.clear())

  it('renders in English when the global language is English', async () => {
    localStorage.setItem('ase_language', 'en')
    renderPage()
    expect(await screen.findByText('This certifies that')).toBeTruthy()
    expect(screen.getByText('Certificate of completion')).toBeTruthy()
    expect(screen.getByText('32 out of 40')).toBeTruthy()
    const pdf = screen.getByRole('link', { name: /Download PDF/ })
    expect(pdf.getAttribute('href')).toBe('/api/v1/academy/certificates/verify/ABC123/pdf?lang=en')
    expect(verifyCertificate).toHaveBeenCalledWith('ABC123', 'en')
  })

  it('stays in Spanish by default', async () => {
    renderPage()
    expect(await screen.findByText('Se certifica que')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Descargar PDF/ }).getAttribute('href')).toContain('lang=es')
  })
})
