import type { jsPDF } from 'jspdf'
import { ASE_BRAND } from './exportBranding'

/** Cycling palette for chart series — brand cyan/gold first, then a small
 * set of desaturated accents so a chart with 5-6 categories still reads
 * cleanly without repeating a color. */
const PALETTE = [
  ASE_BRAND.colors.brand,
  ASE_BRAND.colors.gold,
  ASE_BRAND.colors.brandStrong,
  ASE_BRAND.colors.goldStrong,
  '#A78BFA',
  '#34D399',
  '#F472B6',
  '#FBBF24',
]

export type ChartDatum = { label: string; value: number }

/** Draws a closed, filled polygon from absolute points. jsPDF's `lines()`
 * takes relative deltas between points, so this converts an absolute point
 * list into the delta format it expects. Used for pie/donut slices, which
 * jsPDF has no native primitive for. */
function polygon(doc: jsPDF, points: [number, number][], style: 'F' | 'S' | 'FD' = 'F') {
  if (points.length < 3) return
  const deltas: [number, number][] = []
  for (let i = 1; i < points.length; i += 1) {
    deltas.push([points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]])
  }
  doc.lines(deltas, points[0][0], points[0][1], [1, 1], style, true)
}

export type BarChartOptions = {
  x: number
  y: number
  width: number
  height: number
  data: ChartDatum[]
  title: string
  valueFormatter?: (value: number) => string
}

/** Draws a simple, fully-vector bar chart directly with jsPDF's drawing
 * primitives — no canvas/rasterization involved, so it stays crisp at any
 * zoom or print size. `y` is the top of the block (title baseline); the
 * caller should budget roughly `height + 60` of vertical space including
 * title and axis labels. */
export function drawBarChart(doc: jsPDF, { x, y, width, height, data, title, valueFormatter }: BarChartOptions): void {
  const { colors } = ASE_BRAND
  const fmt = valueFormatter ?? ((v: number) => String(v))

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(colors.slate)
  doc.text(title, x, y)

  const chartTop = y + 16
  const chartBottom = chartTop + height
  const max = Math.max(1, ...data.map((d) => d.value))

  doc.setDrawColor(colors.line)
  doc.setLineWidth(0.3)
  const gridLines = 4
  for (let g = 0; g <= gridLines; g += 1) {
    const gy = chartBottom - (height * g) / gridLines
    doc.line(x, gy, x + width, gy)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(colors.fog)
    doc.text(fmt(Math.round((max * g) / gridLines)), x - 4, gy + 2, { align: 'right' })
  }

  const gap = 12
  const barWidth = (width - gap * (data.length + 1)) / Math.max(1, data.length)

  data.forEach((d, i) => {
    const barHeight = (d.value / max) * height
    const bx = x + gap + i * (barWidth + gap)
    const by = chartBottom - barHeight

    doc.setFillColor(PALETTE[i % PALETTE.length])
    doc.roundedRect(bx, by, Math.max(1, barWidth), Math.max(0.5, barHeight), 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(colors.slate)
    doc.text(fmt(d.value), bx + barWidth / 2, by - 5, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(colors.graphite)
    doc.text(d.label, bx + barWidth / 2, chartBottom + 13, {
      align: 'center',
      maxWidth: barWidth + gap,
    })
  })
}

export type PieChartOptions = {
  x: number
  y: number
  radius: number
  data: ChartDatum[]
  title: string
  /** Fraction of the radius left hollow in the center (0 = full pie,
   * 0.55 = donut). Donut style reads slightly more "dashboard premium". */
  donut?: number
}

/** Draws a donut/pie chart as a set of filled vector polygons approximating
 * each slice's arc, plus a color-keyed legend to the right. `y` is the
 * title baseline; the caller should budget roughly `radius * 2 + 30` of
 * vertical space. */
export function drawPieChart(doc: jsPDF, { x, y, radius, data, title, donut = 0.5 }: PieChartOptions): void {
  const { colors } = ASE_BRAND
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(colors.slate)
  doc.text(title, x, y)

  const cx = x + radius
  const cy = y + radius + 16
  const innerRadius = radius * donut

  let startAngle = -Math.PI / 2
  data.forEach((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2
    const endAngle = startAngle + sweep
    const steps = Math.max(2, Math.ceil((sweep / (Math.PI * 2)) * 64))

    const outer: [number, number][] = []
    const inner: [number, number][] = []
    for (let s = 0; s <= steps; s += 1) {
      const a = startAngle + (sweep * s) / steps
      outer.push([cx + radius * Math.cos(a), cy + radius * Math.sin(a)])
      inner.push([cx + innerRadius * Math.cos(a), cy + innerRadius * Math.sin(a)])
    }
    const ring = [...outer, ...inner.reverse()]

    doc.setFillColor(PALETTE[i % PALETTE.length])
    polygon(doc, ring, 'F')
    startAngle = endAngle
  })

  const legendX = cx + radius + 18
  let legendY = cy - radius + 6
  data.forEach((d, i) => {
    doc.setFillColor(PALETTE[i % PALETTE.length])
    doc.rect(legendX, legendY - 6.5, 8, 8, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(colors.graphite)
    const pct = Math.round((d.value / total) * 100)
    doc.text(`${d.label} — ${d.value} (${pct}%)`, legendX + 12, legendY)
    legendY += 14
  })
}
