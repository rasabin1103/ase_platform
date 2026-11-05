/**
 * Kobalto avanzada para el curso «SQL avanzado»: Kobalto ampliada (clientes,
 * cuentas, tarjetas, transferencias, incidencias, comercios, pagos con
 * tarjeta), los préstamos y cuotas, y además:
 *
 * - `empleados`: la plantilla de Kobalto con su jefe (jerarquía de 6 niveles).
 * - `invitaciones`: el programa «invita a un amigo» (quién invitó a quién), con
 *   un ciclo sembrado por una importación mal hecha (36 ↔ 39).
 * - `eventos_app`: lo que pasa en la app (enero y febrero de 2026), con los
 *   detalles de cada evento en una columna `jsonb`.
 * - `preferencias`: canales e intereses de cada cliente en columnas `text[]`.
 * - `movimientos`: un histórico grande (60.000 apuntes) para practicar índices
 *   y planes de ejecución.
 * - `comercios_import`, `ajustes_limite`, `incidencias_archivo` y
 *   `movimientos_nuevos`: tablas de carga y de archivo para las misiones que
 *   modifican datos. Dos índices repetidos sobre `movimientos(fecha)`.
 * - Anomalías para las reglas de integridad: una cuota repetida y un préstamo
 *   con un plazo que no existe.
 *
 * Datos deterministas (PRNG con semilla fija). «Hoy» = 1 de marzo de 2026.
 * Ver docs/academy/sql-avanzado/PLAN.md §4. Personas y datos ficticios.
 */
import { kobaltoPagosDbSql } from './kobaltoPagosDb'
import { PROBE_SQL } from './probe'
import { prestamosDbSql } from './prestamosDb'

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
const rows = (xs: (string | number | null)[][]) => xs.map((row) => `(${row.map(q).join(', ')})`).join(',\n')

export const AVANZADA_SCHEMA_SQL = `
CREATE TABLE empleados (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  puesto text NOT NULL,
  departamento text NOT NULL,
  jefe_id integer REFERENCES empleados(id),
  salario numeric(10,2) NOT NULL,
  alta date NOT NULL
);
CREATE TABLE invitaciones (
  cliente_id integer PRIMARY KEY REFERENCES clientes(id),
  invitado_por integer NOT NULL REFERENCES clientes(id),
  invitado_en date NOT NULL
);
CREATE TABLE eventos_app (
  id integer PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES clientes(id),
  tipo text NOT NULL,
  ocurrido_en timestamp NOT NULL,
  datos jsonb NOT NULL
);
CREATE TABLE preferencias (
  cliente_id integer PRIMARY KEY REFERENCES clientes(id),
  canales text[],
  intereses text[]
);
CREATE TABLE movimientos (
  id integer PRIMARY KEY,
  cuenta_id integer NOT NULL REFERENCES cuentas(id),
  fecha date NOT NULL,
  importe numeric(12,2) NOT NULL,
  tipo text NOT NULL,
  concepto text NOT NULL,
  estado text NOT NULL
);
CREATE TABLE comercios_import (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  categoria text,
  ciudad text
);
CREATE TABLE ajustes_limite (
  tarjeta_id integer PRIMARY KEY,
  nuevo_limite numeric(10,2) NOT NULL
);
CREATE TABLE incidencias_archivo (LIKE incidencias INCLUDING ALL);
CREATE TABLE movimientos_nuevos (LIKE movimientos INCLUDING ALL);
`

/** [id, nombre, puesto, departamento, jefe_id] */
export const EMPLEADOS: [number, string, string, string, number | null][] = [
  [1, 'Beatriz Sáez', 'CEO', 'Dirección', null],
  [2, 'Jorge Llorente', 'CTO', 'Tecnología', 1],
  [3, 'Paula Ibarra', 'Directora de Producto', 'Producto', 1],
  [4, 'Ramón Quesada', 'Director de Riesgos', 'Riesgos', 1],
  [5, 'Lucía Herrero', 'Directora de Operaciones', 'Operaciones', 1],
  [6, 'Raúl Ortega', 'Engineering Manager', 'Tecnología', 2],
  [7, 'Inés Moreno', 'Responsable de Datos', 'Datos', 2],
  [8, 'Iván Torres', 'Plataforma / DevOps', 'Tecnología', 6],
  [9, 'Laura Méndez', 'QA Lead', 'Tecnología', 6],
  [10, 'Diego Ruiz', 'Backend developer', 'Tecnología', 6],
  [11, 'Tomás Ferrer', 'Desarrollador senior', 'Tecnología', 6],
  [12, 'Sofía Reyes', 'Desarrolladora junior', 'Tecnología', 11],
  [13, 'Sergio Navas', 'QA Automation', 'Tecnología', 9],
  [14, 'Andrés Pino', 'QA Engineer', 'Tecnología', 9],
  [15, 'Clara Montes', 'Analista de datos', 'Datos', 7],
  [16, 'Hugo Serrano', 'Data Engineer', 'Datos', 7],
  [17, 'Marta Sanz', 'Product Owner · Pagos', 'Producto', 3],
  [18, 'Elena Prieto', 'Product Owner · Empresas', 'Producto', 3],
  [19, 'Noelia Castro', 'Diseñadora UX', 'Producto', 3],
  [20, 'Carmen López', 'Riesgos y Compliance', 'Riesgos', 4],
  [21, 'Rubén Gallardo', 'Analista de fraude', 'Riesgos', 20],
  [22, 'Nuria Vidal', 'Responsable de Atención al cliente', 'Operaciones', 5],
  [23, 'Pablo Romero', 'Agente de soporte', 'Operaciones', 22],
  [24, 'Irene Lozano', 'Agente de soporte', 'Operaciones', 22],
  [25, 'Óscar Gil', 'IT · Puesto de trabajo', 'Operaciones', 5],
  [26, 'Marcos Benítez', 'Agente de soporte', 'Operaciones', 22],
  [27, 'Teresa Aguado', 'Analista de riesgos', 'Riesgos', 20],
  [28, 'Víctor Peña', 'Becario de QA', 'Tecnología', 14],
]

/** [cliente_id, invitado_por]. El 36 y el 39 se invitan entre sí: el ciclo de la importación. */
export const INVITACIONES: [number, number][] = [
  [2, 1], [3, 1], [4, 2], [5, 2], [6, 4], [7, 6], [8, 3], [9, 3], [10, 8], [11, 10], [12, 10],
  [13, 1], [14, 13], [15, 13], [16, 14], [20, 17], [21, 20], [22, 20], [23, 22], [24, 17], [25, 24],
  [36, 39], [39, 36],
]

const DISPOSITIVOS = ['ios', 'android', 'web']
const ERRORES: [string, string][] = [['E401', 'login'], ['E409', 'transferencias'], ['E500', 'transferencias'], ['E422', 'tarjetas']]
const CANALES = ['email', 'sms', 'push']
const INTERESES = ['viajes', 'ahorro', 'inversion', 'deporte', 'tecnologia']

export type Evento = [id: number, clienteId: number, tipo: string, ocurrido: string, datos: string]

/** Datos deterministas de las tablas nuevas (también los usan los tests). */
export function kobaltoAvanzadaData() {
  const r = prng(20261104)
  const empleados = EMPLEADOS.map(([id, nombre, puesto, departamento, jefe], i) => {
    const base = jefe === null ? 9000 : puesto.startsWith('Director') || puesto === 'CTO' ? 6500 : puesto.includes('Responsable') || puesto.includes('Manager') || puesto.includes('Lead') ? 4800 : 2600
    const salario = (base + Math.floor(r() * 9) * 125 + (puesto.startsWith('Becario') ? -1500 : 0)).toFixed(2)
    const alta = `20${pad(19 + (i % 6))}-${pad(1 + ((i * 5) % 12))}-${pad(1 + ((i * 7) % 27))}`
    return [id, nombre, puesto, departamento, jefe, salario, alta] as (string | number | null)[]
  })
  // El CEO llegó el primero.
  empleados[0][6] = '2018-03-01'

  const invitaciones = INVITACIONES.map(([c, por], i) => [c, por, `2025-${pad(1 + (i % 12))}-${pad(3 + ((i * 3) % 25))}`] as (string | number | null)[])

  // Eventos de la app: enero y febrero de 2026 (59 días).
  const eventos: Evento[] = []
  let id = 1
  const ts = (d: number, h: number, m: number, s: number) => {
    const t = new Date(Date.UTC(2026, 0, 1 + d))
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())} ${pad(h)}:${pad(m)}:${pad(s)}`
  }
  for (let c = 1; c <= 40; c++) {
    // Cada cliente entra en la app con su propia frecuencia; el 38 nunca.
    const p = c === 38 ? 0 : 0.18 + ((c * 37) % 60) / 100
    const dispositivo = DISPOSITIVOS[c % 3]
    for (let d = 0; d < 59; d++) {
      // Rachas sembradas: el 7 entra los 21 primeros días de febrero seguidos; el 15, del 5 al 18 de enero.
      const forced = (c === 7 && d >= 31 && d <= 51) || (c === 15 && d >= 4 && d <= 17)
      const gap = (c === 7 && (d === 30 || d === 52)) || (c === 15 && (d === 3 || d === 18))
      if (gap || (!forced && r() >= p)) continue
      const h = 7 + Math.floor(r() * 15)
      const login: Record<string, unknown> = { dispositivo, version: `5.${2 + Math.floor(d / 30)}.${c % 4}` }
      // Anomalía: algunas apps antiguas no mandan la versión.
      if (c % 13 === 0 && d % 4 === 0) delete login.version
      eventos.push([id++, c, 'login', ts(d, h, Math.floor(r() * 60), Math.floor(r() * 60)), JSON.stringify(login)])
      const x = r()
      if (x < 0.12) {
        const importe = Math.round((20 + r() * 480) * 100) / 100
        eventos.push([id++, c, 'transferencia', ts(d, h, 59, 10), JSON.stringify({ importe, destino: r() < 0.7 ? 'interna' : 'externa' })])
      } else if (x < 0.16) {
        const [codigo, pantalla] = ERRORES[Math.floor(r() * ERRORES.length)]
        const err: Record<string, unknown> = { codigo, pantalla, reintentos: Math.floor(r() * 4) }
        if (codigo === 'E500') err.detalle = { http: 500, servicio: 'core-transferencias' }
        eventos.push([id++, c, 'error', ts(d, h, 59, 40), JSON.stringify(err)])
      } else if (x < 0.18) {
        eventos.push([id++, c, 'ajuste', ts(d, h, 59, 50), JSON.stringify({ ajuste: 'notificaciones', valor: r() < 0.5 })])
      }
    }
  }

  const preferencias: (string | number | null)[][] = []
  for (let c = 1; c <= 40; c++) {
    if (c === 38) continue // sin preferencias guardadas
    const canales = CANALES.filter((_, i) => ((c >> i) & 1) === 1 || (c % 7 === 0 && i === 0))
    const intereses = c % 11 === 0 ? null : INTERESES.filter((_, i) => (c * (i + 3)) % 5 < 2)
    preferencias.push([c, `{${canales.join(',')}}`, intereses === null ? null : `{${intereses.join(',')}}`])
  }

  const comerciosImport: (string | number | null)[][] = [
    [5, 'Café Central', 'restauracion', 'Bilbao'],
    [6, 'Bar Esquina', 'restauracion', 'Sevilla'],
    [7, 'Pizzería Forno', 'restauracion', 'Zaragoza'],
    [22, 'Floristería Pétalo', 'flores', 'Valencia'],
    [23, 'Librería Tinta', 'compras', 'Madrid'],
    [24, 'Taller Rueda', 'transporte', 'Bilbao'],
    [25, 'Academia Verbo', 'servicios', 'Valencia'],
  ]
  const ajustes: (string | number | null)[][] = [[3, '800.00'], [7, '1500.00'], [11, '600.00'], [19, '2000.00'], [26, '450.00']]
  return { empleados, invitaciones, eventos, preferencias, comerciosImport, ajustes }
}

/**
 * Histórico grande generado por PostgreSQL (rápido de cargar): 60.000
 * apuntes de 2025-01-01 a 2026-02-28 en las 52 cuentas. Casi todos
 * confirmados (unos 300 pendientes) y conceptos con mayúsculas mezcladas.
 */
const MOVIMIENTOS_SQL = `
INSERT INTO movimientos (id, cuenta_id, fecha, importe, tipo, concepto, estado)
SELECT g,
       1 + (g * 7919) % 52,
       DATE '2025-01-01' + (g * 37) % 424,
       ROUND((5 + ((g * 2654435761::bigint) % 99991) / 99991.0 * 1495)::numeric, 2),
       CASE WHEN g % 9 = 0 THEN 'abono' ELSE 'cargo' END,
       (ARRAY['Supermercado', 'NÓMINA', 'Recibo luz', 'Gasolinera', 'Restaurante', 'Farmacia', 'recibo agua', 'Suscripción', 'Bizum', 'Cajero'])[1 + (g * 31) % 10],
       CASE WHEN g % 200 = 7 THEN 'pendiente' ELSE 'confirmado' END
FROM generate_series(1, 60000) AS g;
INSERT INTO movimientos_nuevos (id, cuenta_id, fecha, importe, tipo, concepto, estado)
SELECT 60000 + g, 1 + (g * 7919) % 52, DATE '2026-03-01' + g % 5, ROUND((5 + (g * 977) % 1495)::numeric, 2), 'cargo', 'Supermercado', 'confirmado'
FROM generate_series(1, 500) AS g;
-- Dos índices iguales: alguien lo creó dos veces con nombres distintos (misión 8).
CREATE INDEX movimientos_fecha_idx ON movimientos (fecha);
CREATE INDEX idx_mov_fecha ON movimientos (fecha);
`

/** Funciones de apoyo para comprobar encargos (esquema «qa», oculto en el explorador). */
const QA_SQL = `
CREATE FUNCTION qa.plan(consulta text) RETURNS text LANGUAGE plpgsql AS $plan$
DECLARE r record; salida text := '';
BEGIN
  FOR r IN EXECUTE 'EXPLAIN ' || consulta LOOP
    salida := salida || r."QUERY PLAN" || E'\\n';
  END LOOP;
  RETURN salida;
END
$plan$;
-- Ejecuta las sentencias, lee el resultado de la consulta y lo deshace todo:
-- sirve para comprobar el efecto de un trigger o de una función sin tocar los datos.
CREATE FUNCTION qa.efecto(sentencias text[], consulta text) RETURNS text LANGUAGE plpgsql AS $efecto$
DECLARE s text; resultado text;
BEGIN
  BEGIN
    FOREACH s IN ARRAY sentencias LOOP
      EXECUTE s;
    END LOOP;
    EXECUTE consulta INTO resultado;
    RAISE EXCEPTION USING ERRCODE = 'QA000', MESSAGE = 'deshacer';
  EXCEPTION
    WHEN SQLSTATE 'QA000' THEN RETURN resultado;
    WHEN OTHERS THEN RETURN 'error ' || SQLSTATE;
  END;
END
$efecto$;
`

/** Anomalías para las reglas de integridad (misión 6): una cuota repetida y un plazo imposible. */
const ANOMALIAS_SQL = `
INSERT INTO cuotas (id, prestamo_id, numero, vence_en, importe, pagada_en)
SELECT 900, prestamo_id, numero, vence_en, importe, pagada_en FROM cuotas WHERE prestamo_id = 2 AND numero = 3;
UPDATE prestamos SET plazo_meses = 18 WHERE id = 23;
`

/** SQL completo de Kobalto avanzada. */
export function kobaltoAvanzadaDbSql(): string {
  const d = kobaltoAvanzadaData()
  return [
    kobaltoPagosDbSql(),
    prestamosDbSql(),
    PROBE_SQL,
    QA_SQL,
    AVANZADA_SCHEMA_SQL,
    `INSERT INTO empleados (id, nombre, puesto, departamento, jefe_id, salario, alta) VALUES\n${rows(d.empleados)};`,
    `INSERT INTO invitaciones (cliente_id, invitado_por, invitado_en) VALUES\n${rows(d.invitaciones)};`,
    `INSERT INTO eventos_app (id, cliente_id, tipo, ocurrido_en, datos) VALUES\n${rows(d.eventos)};`,
    `INSERT INTO preferencias (cliente_id, canales, intereses) VALUES\n${rows(d.preferencias)};`,
    `INSERT INTO comercios_import (id, nombre, categoria, ciudad) VALUES\n${rows(d.comerciosImport)};`,
    `INSERT INTO ajustes_limite (tarjeta_id, nuevo_limite) VALUES\n${rows(d.ajustes)};`,
    MOVIMIENTOS_SQL,
    ANOMALIAS_SQL,
    'ANALYZE;',
  ].join('\n')
}
