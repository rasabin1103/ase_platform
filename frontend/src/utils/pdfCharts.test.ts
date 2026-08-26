import { describe, expect, it } from 'vitest'
import { jsPDF } from 'jspdf'
import { drawBarChart, drawPieChart } from './pdfCharts'

describe('pdfCharts', () => {
  it('draws a bar chart without throwing and produces non-empty PDF bytes', () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    expect(() =>
      drawBarChart(doc, {
        x: 48,
        y: 100,
        width: 400,
        height: 120,
        title: 'Catálogo por tipo',
        data: [
          { label: 'Productos', value: 12 },
          { label: 'Cursos', value: 5 },
          { label: 'Libros', value: 3 },
        ],
      }),
    ).not.toThrow()
    const bytes = doc.output('arraybuffer')
    expect(bytes.byteLength).toBeGreaterThan(0)
  })

  it('draws a donut chart with a legend without throwing', () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    expect(() =>
      drawPieChart(doc, {
        x: 48,
        y: 100,
        radius: 60,
        title: 'Organizaciones por tipo',
        data: [
          { label: 'Empresa', value: 7 },
          { label: 'Autónomo', value: 4 },
        ],
      }),
    ).not.toThrow()
    const bytes = doc.output('arraybuffer')
    expect(bytes.byteLength).toBeGreaterThan(0)
  })

  it('handles a single-category chart (no division-by-zero on max/total)', () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    expect(() =>
      drawBarChart(doc, { x: 48, y: 100, width: 200, height: 80, title: 'Solo uno', data: [{ label: 'A', value: 0 }] }),
    ).not.toThrow()
    expect(() =>
      drawPieChart(doc, { x: 48, y: 100, radius: 40, title: 'Solo uno', data: [{ label: 'A', value: 1 }] }),
    ).not.toThrow()
  })
})
