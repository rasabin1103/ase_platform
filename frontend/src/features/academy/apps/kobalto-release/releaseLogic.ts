import type { AppEvent } from '../../engine/types'

/**
 * App bajo prueba de la misión 5: gestor de pruebas (TestHub) con la
 * regresión manual de la release 5.1 y el estado de la integración continua.
 * No da tiempo a ejecutar todos los casos: el reto es elegir por riesgo.
 */

export const RELEASE_BUGS = {
  instantFeeDoubled: 'R1',
  instantOver1000Silent: 'R1b',
  ordinaryFee: 'R-R1',
  androidBiometrics: 'R2',
  sessionNoTimeout: 'R2b',
  loanTier: 'R3',
  androidUnfreeze: 'R4',
  scheduled31: 'R5',
} as const

export const RELEASE_BUG_SLOTS: { slot: string; options: string[] }[] = [
  { slot: 'instant', options: ['R1', 'R1b'] },
  { slot: 'auth', options: ['R2', 'R2b'] },
  { slot: 'loans', options: ['R3'] },
  { slot: 'cards', options: ['R4'] },
  { slot: 'dates', options: ['R5'] },
]

export interface RegressionCase {
  id: string
  area: string
  title: string
  steps: string[]
  expected: string
  minutes: number
  /** Bugs que el caso revela y lo que se observa entonces. */
  detects?: Record<string, string>
}

export const AREAS = [
  'Acceso y sesión',
  'Transferencias',
  'Préstamos',
  'Tarjetas',
  'Transferencias programadas',
  'Cobros (Kobalto Pay)',
  'Movimientos y notificaciones',
  'Onboarding y accesibilidad',
] as const

export const CASES: RegressionCase[] = [
  { id: 'TC-01', area: 'Acceso y sesión', title: 'Login con contraseña (iOS)', steps: ['Abrir la app en iPhone', 'Entrar con usuario y contraseña'], expected: 'Accede a la posición global', minutes: 10 },
  {
    id: 'TC-02',
    area: 'Acceso y sesión',
    title: 'Login con huella (Android 15)',
    steps: ['Abrir la app en Pixel 8 con huella registrada', 'Entrar con la huella'],
    expected: 'Accede a la posición global sin pedir contraseña',
    minutes: 15,
    detects: { R2: 'tras poner la huella aparece «Error de autenticación (-1)» y vuelve a pedir la contraseña' },
  },
  { id: 'TC-03', area: 'Acceso y sesión', title: 'Login con Face ID (iOS)', steps: ['Abrir la app en iPhone', 'Entrar con Face ID'], expected: 'Accede a la posición global', minutes: 10 },
  {
    id: 'TC-04',
    area: 'Acceso y sesión',
    title: 'La sesión caduca tras 5 min de inactividad',
    steps: ['Entrar en la app', 'Dejarla abierta 5 minutos sin tocarla', 'Pulsar «Transferir»'],
    expected: 'Pide de nuevo la autenticación',
    minutes: 15,
    detects: { R2b: 'tras 5 minutos sigue dentro y deja hacer una transferencia sin volver a autenticarse' },
  },
  {
    id: 'TC-05',
    area: 'Transferencias',
    title: 'Transferencia instantánea de 50 € (comisión 0,25 €)',
    steps: ['Transferir 50 € a una cuenta de otro banco', 'Elegir «Instantánea»'],
    expected: 'Llega en segundos y se cobra 0,25 € de comisión',
    minutes: 15,
    detects: { R1: 'se cobran 0,50 € de comisión (doble)' },
  },
  {
    id: 'TC-06',
    area: 'Transferencias',
    title: 'Transferencia instantánea de 1.000 € (límite)',
    steps: ['Transferir 1.000 € a otro banco', 'Elegir «Instantánea»'],
    expected: 'Se envía como instantánea con 0,25 € de comisión',
    minutes: 15,
    detects: { R1: 'se cobran 0,50 € de comisión (doble)' },
  },
  {
    id: 'TC-07',
    area: 'Transferencias',
    title: 'Instantánea de 1.500 € (por encima del límite)',
    steps: ['Transferir 1.500 € a otro banco', 'Elegir «Instantánea»'],
    expected: 'Avisa de que supera 1.000 € y ofrece enviarla como ordinaria',
    minutes: 20,
    detects: { R1b: 'no avisa: se envía como ordinaria (llega el lunes) mostrando «Instantánea enviada»' },
  },
  {
    id: 'TC-08',
    area: 'Transferencias',
    title: 'Transferencia ordinaria SEPA (sin comisión)',
    steps: ['Transferir 50 € a otro banco', 'Elegir «Ordinaria»'],
    expected: 'Se envía sin comisión',
    minutes: 10,
    detects: { 'R-R1': 'se cobran 0,25 € de comisión en una ordinaria' },
  },
  { id: 'TC-09', area: 'Préstamos', title: 'Simulación con 9.900 € (TIN 6,95 %)', steps: ['Simular 9.900 € a 60 meses'], expected: 'TIN 6,95 %', minutes: 10 },
  {
    id: 'TC-10',
    area: 'Préstamos',
    title: 'Simulación con 10.000 € (nuevo TIN 5,75 %)',
    steps: ['Simular 10.000 € a 60 meses'],
    expected: 'TIN 5,75 % (nuevo tramo de la 5.1)',
    minutes: 10,
    detects: { R3: 'muestra TIN 6,95 %: el tramo nuevo solo se aplica por encima de 10.000 €' },
  },
  {
    id: 'TC-11',
    area: 'Préstamos',
    title: 'Ejemplos validados por Riesgos (tabla 5.1)',
    steps: ['Simular los 5 ejemplos de la tabla de Riesgos de la 5.1'],
    expected: 'Las cuotas coinciden al céntimo',
    minutes: 25,
    detects: { R3: 'el ejemplo de 10.000 € sale con TIN 6,95 % y la cuota no coincide' },
  },
  { id: 'TC-12', area: 'Tarjetas', title: 'Congelar y pagar en Android', steps: ['Congelar la tarjeta en Pixel 8', 'Pagar 20 € en el comercio de pruebas'], expected: 'Compra rechazada', minutes: 15 },
  {
    id: 'TC-13',
    area: 'Tarjetas',
    title: 'Descongelar y pagar en Android',
    steps: ['Con la tarjeta congelada, descongelarla en Pixel 8', 'Pagar 20 € en el comercio de pruebas'],
    expected: 'Compra aprobada',
    minutes: 15,
    detects: { R4: 'la app muestra «Activa» pero la compra se rechaza por «tarjeta congelada»' },
  },
  { id: 'TC-14', area: 'Tarjetas', title: 'Límite mensual «1,000» con la app en inglés', steps: ['App en inglés', 'Guardar límite «1,000»'], expected: 'Límite de 1.000 €', minutes: 10 },
  {
    id: 'TC-15',
    area: 'Transferencias programadas',
    title: 'Programada mensual el día 31',
    steps: ['Programar una transferencia mensual el día 31', 'Ver las próximas ejecuciones'],
    expected: 'En los meses cortos se ejecuta el último día (30 de noviembre)',
    minutes: 20,
    detects: { R5: 'noviembre no aparece: salta del 31 de octubre al 31 de diciembre' },
  },
  { id: 'TC-16', area: 'Transferencias programadas', title: 'Cancelar solo la próxima de una serie', steps: ['Cancelar la próxima ejecución de una semanal'], expected: 'La serie sigue activa', minutes: 15 },
  { id: 'TC-17', area: 'Cobros (Kobalto Pay)', title: 'Devolver un cobro anulado', steps: ['Crear cobro anulado', 'Devolver 20 €'], expected: '409 y el cobro no cambia', minutes: 10 },
  { id: 'TC-18', area: 'Cobros (Kobalto Pay)', title: 'Devoluciones sucesivas hasta el total', steps: ['Devolver 60 € y luego 40 € de 100 €'], expected: 'Queda «Devuelto»', minutes: 15 },
  { id: 'TC-19', area: 'Movimientos y notificaciones', title: 'Exportar movimientos de septiembre', steps: ['Exportar del 1 al 30 de septiembre'], expected: 'Incluye el movimiento del día 30', minutes: 10 },
  { id: 'TC-20', area: 'Movimientos y notificaciones', title: 'Notificación de transferencia recibida', steps: ['Recibir 10 € desde otra cuenta'], expected: 'Llega la notificación push', minutes: 15 },
  { id: 'TC-21', area: 'Onboarding y accesibilidad', title: 'Textos del nuevo onboarding', steps: ['Revisar las 5 pantallas del onboarding'], expected: 'Sin erratas y con los textos aprobados', minutes: 20 },
  { id: 'TC-22', area: 'Onboarding y accesibilidad', title: 'Accesibilidad básica de la pantalla de inicio', steps: ['Navegar con lector de pantalla'], expected: 'Todos los botones tienen etiqueta', minutes: 20 },
]

export const TOTAL_MINUTES = CASES.reduce((n, c) => n + c.minutes, 0)

export interface ReleaseState {
  results: Record<string, { result: 'pass' | 'fail'; build: number; actual?: string }>
  ciReruns: number
}
export const INITIAL_RELEASE: ReleaseState = { results: {}, ciReruns: 0 }

export interface ReleaseBuild {
  active?: string[]
  fixed?: string[]
  regressions?: string[]
}

function live(build: ReleaseBuild): (b: string) => boolean {
  const active = new Set(build.active ?? RELEASE_BUG_SLOTS.map((s) => s.options[0]))
  const fixed = new Set(build.fixed ?? [])
  const regs = new Set((build.regressions ?? []).filter((r) => !fixed.has(r)))
  return (b) => (active.has(b) && !fixed.has(b)) || regs.has(b)
}

/** Ejecuta un caso de regresión en el build actual. */
export function runCase(state: ReleaseState, caseId: string, buildNo: number, build: ReleaseBuild = {}): { state: ReleaseState; event: AppEvent; failed: boolean } {
  const c = CASES.find((x) => x.id === caseId)
  if (!c) throw new Error(`Caso ${caseId} no encontrado`)
  const has = live(build)
  const bug = Object.keys(c.detects ?? {}).find(has)
  const label = `5.1.0-rc${2 + buildNo}`
  const next: ReleaseState = { ...state, results: { ...state.results, [c.id]: { result: bug ? 'fail' : 'pass', build: buildNo, actual: bug ? c.detects![bug] : undefined } } }
  return {
    state: next,
    failed: !!bug,
    event: {
      app: 'kobalto-release',
      action: 'run',
      summary: bug ? `${c.id} ${c.title} → FALLA: ${c.detects![bug]}` : `${c.id} ${c.title} → PASA (${c.expected.toLowerCase()})`,
      technical: `TestHub · ${c.id} · build ${label} · ${bug ? 'FAILED' : 'PASSED'} · ${c.minutes} min`,
      status: bug ? 'error' : 'ok',
      bugs: bug ? [bug] : [],
      cost: c.minutes,
    },
  }
}

/** Relanza el test automático que falla en CI: es inestable (flaky), no un bug. */
export function rerunCi(state: ReleaseState): { state: ReleaseState; event: AppEvent } {
  return {
    state: { ...state, ciReruns: state.ciReruns + 1 },
    event: {
      app: 'kobalto-release',
      action: 'ci_rerun',
      summary: 'CI · relanzado test_export_csv_timeout → PASA (3 de los últimos 10 builds falló y pasó al relanzar: test inestable)',
      technical: 'CI job #4182 · test_export_csv_timeout · PASSED (retry 1) · history: 3/10 flaky',
      status: 'ok',
      bugs: [],
      cost: 5,
    },
  }
}
