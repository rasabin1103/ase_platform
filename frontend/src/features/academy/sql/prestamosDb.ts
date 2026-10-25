/**
 * Datos del examen práctico de «SQL desde cero»: la base de datos de Kobalto
 * más dos tablas que el alumno no ha visto en el curso, `prestamos` y `cuotas`
 * (el nuevo producto de préstamos personales). Deterministas y con una
 * anomalía sembrada: el préstamo 19 está aprobado pero no tiene cuotas.
 * Ver docs/academy/sql-iniciacion/missions/m10-examen.md.
 */

const pad = (n: number, w = 2) => String(n).padStart(w, '0')
const day = (iso: string, offset: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + offset)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}
const addMonths = (iso: string, months: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + months)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** «Hoy» en el examen: las cuotas que vencen antes están vencidas. */
export const EXAM_TODAY = '2026-03-01'

export const PRESTAMOS_SCHEMA = `
CREATE TABLE prestamos (
  id integer PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES clientes(id),
  importe numeric(12,2) NOT NULL,
  plazo_meses integer NOT NULL,
  tipo_interes numeric(5,2) NOT NULL,
  estado text NOT NULL,
  solicitado_en date NOT NULL,
  aprobado_en date
);
CREATE TABLE cuotas (
  id integer PRIMARY KEY,
  prestamo_id integer NOT NULL REFERENCES prestamos(id),
  numero integer NOT NULL,
  vence_en date NOT NULL,
  importe numeric(10,2) NOT NULL,
  pagada_en date
);
`

export type Prestamo = [id: number, clienteId: number, importe: string, plazo: number, interes: string, estado: string, solicitado: string, aprobado: string | null]
export type Cuota = [id: number, prestamoId: number, numero: number, venceEn: string, importe: string, pagadaEn: string | null]

/** Estado de cada préstamo (posición = id − 1). */
const ESTADOS = 'AASARAACASAARSAAACARSAACA'
const ESTADO: Record<string, string> = { A: 'aprobado', S: 'solicitado', R: 'rechazado', C: 'cancelado' }
const PLAZOS = [12, 24, 36, 48, 60]

export function prestamosData(): { prestamos: Prestamo[]; cuotas: Cuota[] } {
  const prestamos: Prestamo[] = []
  for (let i = 1; i <= 25; i++) {
    const estado = ESTADO[ESTADOS[i - 1]]
    const importe = 1000 + ((i * 2753) % 29) * 1000 + i * 10
    const interes = (5 + ((i * 7) % 9) * 0.25).toFixed(2)
    const solicitado = day('2025-09-01', i * 7)
    const aprobado = estado === 'aprobado' || estado === 'cancelado' ? day(solicitado, 3 + (i % 5)) : null
    prestamos.push([i, ((i * 11) % 37) + 1, importe.toFixed(2), PLAZOS[i % PLAZOS.length], interes, estado, solicitado, aprobado])
  }
  const cuotas: Cuota[] = []
  let id = 1
  for (const p of prestamos) {
    // Anomalía: el préstamo 19 está aprobado pero nunca se le generaron cuotas.
    if (p[5] !== 'aprobado' || p[0] === 19) continue
    const mensual = Math.round((Number(p[2]) / p[3]) * (1 + Number(p[4]) / 100) * 100) / 100
    for (let n = 1; n <= Math.min(p[3], 6); n++) {
      const vence = addMonths(p[7]!, n)
      // Pagadas las vencidas, salvo algunas de los préstamos 4, 11 y 16 (morosos).
      const moroso = (p[0] === 4 && n >= 2) || (p[0] === 11 && n === 3) || (p[0] === 16 && n >= 4)
      const pagada = vence < EXAM_TODAY && !moroso ? day(vence, -(n % 3)) : null
      cuotas.push([id++, p[0], n, vence, mensual.toFixed(2), pagada])
    }
  }
  return { prestamos, cuotas }
}

const q = (v: string | number | null) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v}'`)

/** SQL de las tablas del examen (se añade al de Kobalto). */
export function prestamosDbSql(): string {
  const { prestamos, cuotas } = prestamosData()
  return [
    PRESTAMOS_SCHEMA,
    `INSERT INTO prestamos (id, cliente_id, importe, plazo_meses, tipo_interes, estado, solicitado_en, aprobado_en) VALUES\n${prestamos.map((p) => `(${p.map(q).join(', ')})`).join(',\n')};`,
    `INSERT INTO cuotas (id, prestamo_id, numero, vence_en, importe, pagada_en) VALUES\n${cuotas.map((c) => `(${c.map(q).join(', ')})`).join(',\n')};`,
  ].join('\n')
}
