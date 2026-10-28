/**
 * Kobalto ampliada para el curso «SQL intermedio» (desde la misión 2): la base
 * del primer curso más `comercios` y `pagos_tarjeta`.
 *
 * Datos deterministas (PRNG con semilla fija), de enero de 2025 a febrero de
 * 2026 (enero y febrero existen en dos años), con anomalías sembradas para las
 * misiones de calidad de datos: pagos duplicados, pagos aceptados con la
 * tarjeta bloqueada, un comercio sin categoría, nombres con espacios de más y
 * algunos importes muy altos. Ver docs/academy/sql-intermedio/PLAN.md §4.
 *
 * Personas, comercios y datos ficticios.
 */
import { kobaltoData, kobaltoDbSql } from './kobaltoDb'

function prng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0')
const q = (v: string | number | null) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`)

export const PAGOS_SCHEMA_SQL = `
CREATE TABLE comercios (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  categoria text,
  ciudad text
);
CREATE TABLE pagos_tarjeta (
  id integer PRIMARY KEY,
  tarjeta_id integer NOT NULL REFERENCES tarjetas(id),
  comercio_id integer NOT NULL REFERENCES comercios(id),
  importe numeric(10,2) NOT NULL,
  estado text NOT NULL,
  pagado_en timestamp NOT NULL
);
`

/** [id, nombre, categoria, ciudad, importe mínimo, importe máximo] */
const COMERCIOS: [number, string, string | null, string | null, number, number][] = [
  [1, 'Supermercados Ría', 'alimentacion', 'Madrid', 12, 140],
  [2, 'Mercado Sol', 'alimentacion', 'Barcelona', 8, 90],
  [3, 'Panadería Espiga', 'alimentacion', 'Valencia', 2, 18],
  [4, 'Restaurante Olivo', 'restauracion', 'Madrid', 18, 95],
  [5, ' Café Central', 'restauracion', 'Bilbao', 3, 15],
  [6, 'Bar Esquina  ', 'restauracion', 'Sevilla', 4, 30],
  [7, 'PIZZERÍA FORNO', 'restauracion', 'Zaragoza', 12, 45],
  [8, 'Gasolinera Norte', 'transporte', 'Madrid', 30, 85],
  [9, 'Taxi Ciudad', 'transporte', 'Barcelona', 8, 40],
  [10, 'Parking Centro', 'transporte', 'Málaga', 3, 25],
  [11, 'Cine Avenida', 'ocio', 'Madrid', 8, 30],
  [12, 'Gimnasio Forma', 'ocio', 'Valencia', 30, 60],
  [13, 'Librería Página', 'compras', 'Sevilla', 10, 60],
  [14, 'Electrónica Voltio', 'compras', 'Madrid', 25, 900],
  [15, 'Zapatería Paso', 'compras', 'Bilbao', 35, 140],
  [16, 'Tienda Online Nube', 'compras', null, 10, 250],
  [17, 'Farmacia Luna', 'salud', 'Barcelona', 4, 45],
  [18, 'Óptica Visión', 'salud', 'Zaragoza', 40, 320],
  [19, 'Hotel Brisa', 'viajes', 'Málaga', 80, 450],
  [20, 'Viajes Horizonte', 'viajes', 'Madrid', 150, 1200],
  [21, 'Peluquería Tijera', 'servicios', 'Madrid', 12, 60],
  [22, 'Floristería Pétalo', null, 'Valencia', 15, 70],
]

export type Pago = [id: number, tarjetaId: number, comercioId: number, importe: string, estado: string, pagadoEn: string]

/** Datos deterministas de la ampliación (también los usan los tests). */
export function kobaltoPagosData(): { comercios: (string | number | null)[][]; pagos: Pago[] } {
  const r = prng(20261028)
  const { tarjetas } = kobaltoData()
  const tarjetaIds = tarjetas.map((t) => Number(t[0]))
  const bloqueada = Number(tarjetas.find((t) => t[4] === 'bloqueada')![0])
  const start = Date.UTC(2025, 0, 1)
  const span = Date.UTC(2026, 2, 1) - start

  const pagos: Pago[] = []
  for (let id = 1; id <= 300; id++) {
    const com = COMERCIOS[(id * 7 + Math.floor(r() * 5)) % COMERCIOS.length]
    const tarjeta = tarjetaIds[Math.floor(r() * tarjetaIds.length)]
    // La tarjeta bloqueada solo tiene pagos rechazados… salvo tres (anomalía, abajo).
    let estado = r() < 0.06 ? 'rechazado' : r() < 0.03 ? 'devuelto' : 'aceptado'
    if (tarjeta === bloqueada) estado = 'rechazado'
    let importe = com[4] + r() * (com[5] - com[4])
    // Anomalía: algunos importes muy altos.
    if (id % 97 === 0) importe = 2500 + id * 3
    const t = new Date(start + Math.floor((id - 1 + r() * 0.9) * (span / 300)))
    // Hora: casi todo de día; uno de cada 23 pagos, de madrugada.
    const hour = id % 23 === 0 ? Math.floor(r() * 5) + 1 : 6 + Math.floor(r() * 16)
    const when = `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${pad(hour)}:${pad(Math.floor(r() * 60))}:${pad(Math.floor(r() * 60))}`
    pagos.push([id, tarjeta, com[0], importe.toFixed(2), estado, when])
  }
  // Anomalía: tres pagos aceptados con la tarjeta bloqueada.
  for (const [id, base] of [[301, 40], [302, 120], [303, 260]] as const) {
    const b = pagos[base - 1]
    pagos.push([id, bloqueada, b[2], b[3], 'aceptado', b[5].replace(/:\d\d$/, ':30')])
  }
  // Anomalía: tres pagos duplicados (misma tarjeta, comercio, importe y momento).
  for (const [id, base] of [[304, 55], [305, 180], [306, 233]] as const) {
    const b = pagos[base - 1]
    pagos.push([id, b[1], b[2], b[3], b[4], b[5]])
  }
  const comercios = COMERCIOS.map(([id, nombre, categoria, ciudad]) => [id, nombre, categoria, ciudad])
  return { comercios, pagos }
}

/** SQL completo: Kobalto del primer curso + comercios y pagos con tarjeta. */
export function kobaltoPagosDbSql(): string {
  const { comercios, pagos } = kobaltoPagosData()
  const rows = (xs: (string | number | null)[][]) => xs.map((row) => `(${row.map(q).join(', ')})`).join(',\n')
  return [
    kobaltoDbSql(),
    PAGOS_SCHEMA_SQL,
    `INSERT INTO comercios (id, nombre, categoria, ciudad) VALUES\n${rows(comercios)};`,
    `INSERT INTO pagos_tarjeta (id, tarjeta_id, comercio_id, importe, estado, pagado_en) VALUES\n${rows(pagos)};`,
  ].join('\n')
}
