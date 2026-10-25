/**
 * Base de datos de Kobalto para el curso «SQL desde cero».
 *
 * Esquema y datos deterministas (mismo contenido en cada partida, generado con
 * un PRNG con semilla fija), con anomalías sembradas que los encargos ayudan a
 * descubrir. Ver docs/academy/sql-iniciacion/PLAN.md §3.
 *
 * Nombres de tablas y columnas en español y sin tildes. Personas y datos ficticios.
 */

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

const NOMBRES = ['Ana', 'Pablo', 'Lucía', 'Javier', 'Marta', 'Diego', 'Sofía', 'Hugo', 'Elena', 'Daniel', 'Carmen', 'Álvaro', 'Laura', 'Adrián', 'Paula', 'Sergio', 'Irene', 'Raúl', 'Nerea', 'Iván']
const APELLIDOS = ['García', 'Martín', 'López', 'Sánchez', 'Romero', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano', 'Molina', 'Ortiz', 'Delgado', 'Castro', 'Rubio', 'Marín', 'Iglesias', 'Medina']
const CIUDADES = ['Madrid', 'Madrid', 'Madrid', 'Barcelona', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Zaragoza', 'Málaga']
const SEGMENTOS = ['estandar', 'estandar', 'estandar', 'premium', 'joven']
const CONCEPTOS = ['Alquiler', 'Cena', 'Regalo', 'Viaje', 'Nómina', 'Devolución', 'Compra online', 'Gimnasio', 'Factura luz', 'Préstamo']
const MOTIVOS = ['Tarjeta bloqueada', 'Transferencia retenida', 'Cambio de datos', 'Comisión no reconocida', 'Acceso a la app']
const CANALES = ['chat', 'telefono', 'email']

const ascii = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const q = (s: string | null) => (s === null ? 'NULL' : `'${s.replace(/'/g, "''")}'`)
const pad = (n: number, w = 2) => String(n).padStart(w, '0')
const day = (base: Date, offset: number) => {
  const d = new Date(base.getTime() + offset * 86_400_000)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export const SCHEMA_SQL = `
CREATE TABLE clientes (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  apellidos text NOT NULL,
  email text NOT NULL,
  ciudad text NOT NULL,
  fecha_alta date NOT NULL,
  segmento text
);
CREATE TABLE cuentas (
  id integer PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES clientes(id),
  iban text NOT NULL UNIQUE,
  tipo text NOT NULL,
  saldo numeric(12,2) NOT NULL,
  moneda text NOT NULL DEFAULT 'EUR',
  abierta_en date NOT NULL,
  estado text NOT NULL
);
CREATE TABLE tarjetas (
  id integer PRIMARY KEY,
  cuenta_id integer NOT NULL REFERENCES cuentas(id),
  tipo text NOT NULL,
  limite_diario numeric(10,2) NOT NULL,
  estado text NOT NULL,
  caduca_en date NOT NULL
);
CREATE TABLE transferencias (
  id integer PRIMARY KEY,
  cuenta_origen_id integer NOT NULL REFERENCES cuentas(id),
  cuenta_destino_id integer,
  importe numeric(12,2) NOT NULL,
  concepto text,
  estado text NOT NULL,
  creada_en timestamp NOT NULL
);
CREATE TABLE incidencias (
  id integer PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES clientes(id),
  canal text NOT NULL,
  motivo text NOT NULL,
  abierta_en timestamp NOT NULL,
  cerrada_en timestamp
);
`

export interface KobaltoData {
  clientes: (string | number | null)[][]
  cuentas: (string | number | null)[][]
  tarjetas: (string | number | null)[][]
  transferencias: (string | number | null)[][]
  incidencias: (string | number | null)[][]
}

/** Datos deterministas de Kobalto (también los usan los tests). */
export function kobaltoData(): KobaltoData {
  const r = prng(20261024)
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)]
  const base = new Date(Date.UTC(2024, 0, 8))

  const clientes: KobaltoData['clientes'] = []
  for (let i = 1; i <= 40; i++) {
    // La segunda vuelta (i > 20) se desplaza para que no haya homónimos exactos.
    const vuelta = i > 20 ? 1 : 0
    const nombre = NOMBRES[(i * 7 + vuelta * 3) % NOMBRES.length]
    const apellidos = `${APELLIDOS[(i * 3 + vuelta * 8) % APELLIDOS.length]} ${APELLIDOS[(i * 11 + 5 + vuelta * 6) % APELLIDOS.length]}`
    let email = `${ascii(nombre)}.${ascii(apellidos.split(' ')[0])}${i}@${i % 4 === 0 ? 'correo.es' : 'mail.com'}`
    // Anomalía: dos clientes comparten email.
    if (i === 27) email = String(clientes[11][3])
    // Anomalía: dos clientes sin segmento.
    const segmento = i === 9 || i === 33 ? null : pick(SEGMENTOS)
    clientes.push([i, nombre, apellidos, email, CIUDADES[(i * 7) % CIUDADES.length], day(base, i * 17 + Math.floor(r() * 10)), segmento])
  }

  const cuentas: KobaltoData['cuentas'] = []
  let cid = 1
  for (let c = 1; c <= 40; c++) {
    // Anomalía: el cliente 38 no tiene ninguna cuenta.
    const n = c === 38 ? 0 : c % 3 === 0 ? 2 : 1
    for (let k = 0; k < n; k++) {
      const tipo = k === 0 ? 'corriente' : 'ahorro'
      let saldo = Math.round((tipo === 'ahorro' ? 2000 + r() * 30000 : 50 + r() * 9000) * 100) / 100
      if (cid === 17) saldo = -245.3 // Anomalía: saldo negativo.
      const estado = cid === 8 || cid === 41 ? 'bloqueada' : cid === 23 ? 'cerrada' : 'activa'
      cuentas.push([cid, c, `ES76 2100 ${pad(1000 + cid, 4)} ${pad(4000 + c * 7, 4)} ${pad(cid * 13, 4)}`, tipo, saldo.toFixed(2), 'EUR', day(base, c * 17 + 3 + k * 40), estado])
      cid++
    }
  }

  const tarjetas: KobaltoData['tarjetas'] = []
  let tid = 1
  for (const cu of cuentas) {
    if (cu[3] !== 'corriente' || Number(cu[0]) % 5 === 4) continue
    const tipo = Number(cu[0]) % 4 === 0 ? 'credito' : 'debito'
    const caduca = Number(cu[0]) % 9 === 0 ? day(base, 300) : day(base, 900 + Number(cu[0]) * 20)
    // Anomalía: una tarjeta caducada sigue activa (la de la cuenta 9); la de la 18 está bloqueada.
    const estado = Number(cu[0]) === 18 ? 'bloqueada' : 'activa'
    tarjetas.push([tid++, cu[0], tipo, tipo === 'credito' ? '1500.00' : '600.00', estado, caduca])
    if (tid > 35) break
  }

  const transferencias: KobaltoData['transferencias'] = []
  const ids = cuentas.map((c) => Number(c[0]))
  for (let t = 1; t <= 120; t++) {
    const origen = ids[(t * 7) % ids.length]
    let destino: number | null = r() < 0.2 ? null : ids[(t * 11 + 5) % ids.length]
    if (destino === origen) destino = ids[(t * 11 + 6) % ids.length]
    if (t === 77) destino = 999 // Anomalía: cuenta de destino que no existe.
    const importe = t % 25 === 0 ? 12000 + t * 37 : Math.round((5 + r() * 900) * 100) / 100
    const estado = t % 17 === 0 ? 'rechazada' : t % 11 === 0 ? 'pendiente' : 'completada'
    const concepto = t % 13 === 0 ? null : pick(CONCEPTOS)
    const d = day(base, 640 + Math.floor((t * 97) % 160))
    transferencias.push([t, origen, destino, importe.toFixed(2), concepto, estado, `${d} ${pad(8 + (t % 12))}:${pad((t * 7) % 60)}:00`])
  }

  const incidencias: KobaltoData['incidencias'] = []
  for (let i = 1; i <= 30; i++) {
    const cliente = ((i * 7) % 37) + 1
    const d = day(base, 650 + i * 5)
    const abierta = `${d} ${pad(9 + (i % 8))}:${pad((i * 11) % 60)}:00`
    const cerrada = i % 4 === 0 || i === 29 ? null : `${day(base, 650 + i * 5 + 1 + (i % 3))} ${pad(10 + (i % 7))}:00:00`
    incidencias.push([i, cliente, CANALES[i % 3], MOTIVOS[(i * 3) % MOTIVOS.length], abierta, cerrada])
  }

  return { clientes, cuentas, tarjetas, transferencias, incidencias }
}

function inserts(table: string, cols: string[], rows: (string | number | null)[][]) {
  const values = rows.map((row) => `(${row.map((v) => (typeof v === 'number' ? String(v) : q(v))).join(', ')})`).join(',\n')
  return `INSERT INTO ${table} (${cols.join(', ')}) VALUES\n${values};`
}

/** SQL completo (esquema + datos) de la base de datos de Kobalto. */
export function kobaltoDbSql(): string {
  const d = kobaltoData()
  return [
    SCHEMA_SQL,
    inserts('clientes', ['id', 'nombre', 'apellidos', 'email', 'ciudad', 'fecha_alta', 'segmento'], d.clientes),
    inserts('cuentas', ['id', 'cliente_id', 'iban', 'tipo', 'saldo', 'moneda', 'abierta_en', 'estado'], d.cuentas),
    inserts('tarjetas', ['id', 'cuenta_id', 'tipo', 'limite_diario', 'estado', 'caduca_en'], d.tarjetas),
    inserts('transferencias', ['id', 'cuenta_origen_id', 'cuenta_destino_id', 'importe', 'concepto', 'estado', 'creada_en'], d.transferencias),
    inserts('incidencias', ['id', 'cliente_id', 'canal', 'motivo', 'abierta_en', 'cerrada_en'], d.incidencias),
  ].join('\n')
}
