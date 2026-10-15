import type { AppEvent } from '../../engine/types'
import type { AcademyLang } from '../../i18n'

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

export const AREAS_EN = [
  'Login and session',
  'Transfers',
  'Loans',
  'Cards',
  'Scheduled transfers',
  'Payments (Kobalto Pay)',
  'Transactions and notifications',
  'Onboarding and accessibility',
] as const

type CaseText = Pick<RegressionCase, 'title' | 'steps' | 'expected' | 'detects'>

/** Textos en inglés de cada caso (mismos ids, minutos y bugs que CASES). */
const CASES_EN: Record<string, CaseText> = {
  'TC-01': { title: 'Password login (iOS)', steps: ['Open the app on an iPhone', 'Log in with username and password'], expected: 'Lands on the account overview' },
  'TC-02': {
    title: 'Fingerprint login (Android 15)',
    steps: ['Open the app on a Pixel 8 with a registered fingerprint', 'Log in with the fingerprint'],
    expected: 'Lands on the account overview without asking for the password',
    detects: { R2: 'after the fingerprint, "Authentication error (-1)" appears and it asks for the password again' },
  },
  'TC-03': { title: 'Face ID login (iOS)', steps: ['Open the app on an iPhone', 'Log in with Face ID'], expected: 'Lands on the account overview' },
  'TC-04': {
    title: 'Session expires after 5 min of inactivity',
    steps: ['Log in to the app', 'Leave it open for 5 minutes without touching it', 'Tap "Transfer"'],
    expected: 'Asks for authentication again',
    detects: { R2b: 'after 5 minutes it is still logged in and allows a transfer without re-authenticating' },
  },
  'TC-05': {
    title: '€50 instant transfer (€0.25 fee)',
    steps: ['Transfer €50 to an account at another bank', 'Choose "Instant"'],
    expected: 'Arrives in seconds and a €0.25 fee is charged',
    detects: { R1: 'a €0.50 fee is charged (double)' },
  },
  'TC-06': {
    title: '€1,000 instant transfer (limit)',
    steps: ['Transfer €1,000 to another bank', 'Choose "Instant"'],
    expected: 'Sent as instant with a €0.25 fee',
    detects: { R1: 'a €0.50 fee is charged (double)' },
  },
  'TC-07': {
    title: '€1,500 instant transfer (over the limit)',
    steps: ['Transfer €1,500 to another bank', 'Choose "Instant"'],
    expected: 'Warns that it exceeds €1,000 and offers to send it as a standard transfer',
    detects: { R1b: 'no warning: it is sent as a standard transfer (arrives Monday) while showing "Instant transfer sent"' },
  },
  'TC-08': {
    title: 'Standard SEPA transfer (no fee)',
    steps: ['Transfer €50 to another bank', 'Choose "Standard"'],
    expected: 'Sent with no fee',
    detects: { 'R-R1': 'a €0.25 fee is charged on a standard transfer' },
  },
  'TC-09': { title: '€9,900 quote (6.95% nominal rate)', steps: ['Simulate €9,900 over 60 months'], expected: '6.95% nominal rate' },
  'TC-10': {
    title: '€10,000 quote (new 5.75% nominal rate)',
    steps: ['Simulate €10,000 over 60 months'],
    expected: '5.75% nominal rate (new 5.1 tier)',
    detects: { R3: 'shows a 6.95% nominal rate: the new tier only applies above €10,000' },
  },
  'TC-11': {
    title: 'Examples validated by Risk (5.1 table)',
    steps: ['Simulate the 5 examples from the Risk team\'s 5.1 table'],
    expected: 'Installments match to the cent',
    detects: { R3: 'the €10,000 example comes out at a 6.95% nominal rate and the installment does not match' },
  },
  'TC-12': { title: 'Freeze and pay on Android', steps: ['Freeze the card on a Pixel 8', 'Pay €20 at the test merchant'], expected: 'Purchase declined' },
  'TC-13': {
    title: 'Unfreeze and pay on Android',
    steps: ['With the card frozen, unfreeze it on a Pixel 8', 'Pay €20 at the test merchant'],
    expected: 'Purchase approved',
    detects: { R4: 'the app shows "Active" but the purchase is declined with "card frozen"' },
  },
  'TC-14': { title: 'Monthly limit "1,000" with the app in English', steps: ['App in English', 'Save limit "1,000"'], expected: '€1,000 limit' },
  'TC-15': {
    title: 'Monthly transfer scheduled on the 31st',
    steps: ['Schedule a monthly transfer on the 31st', 'View the upcoming runs'],
    expected: 'In short months it runs on the last day (November 30)',
    detects: { R5: 'November is missing: it jumps from October 31 to December 31' },
  },
  'TC-16': { title: 'Cancel only the next run of a series', steps: ['Cancel the next run of a weekly transfer'], expected: 'The series stays active' },
  'TC-17': { title: 'Refund a voided payment', steps: ['Create a voided payment', 'Refund €20'], expected: '409 and the payment does not change' },
  'TC-18': { title: 'Successive refunds up to the total', steps: ['Refund €60 and then €40 of €100'], expected: 'Ends up "Refunded"' },
  'TC-19': { title: 'Export September transactions', steps: ['Export from September 1 to 30'], expected: 'Includes the transaction on the 30th' },
  'TC-20': { title: 'Incoming transfer notification', steps: ['Receive €10 from another account'], expected: 'The push notification arrives' },
  'TC-21': { title: 'Copy of the new onboarding', steps: ['Review the 5 onboarding screens'], expected: 'No typos and the approved copy' },
  'TC-22': { title: 'Basic accessibility of the home screen', steps: ['Navigate with a screen reader'], expected: 'Every button has a label' },
}

/** Áreas de regresión en el idioma pedido. */
export function areasFor(lang: AcademyLang = 'es'): readonly string[] {
  return lang === 'en' ? AREAS_EN : AREAS
}

/** Casos de regresión en el idioma pedido (mismos ids, minutos y bugs). */
export function casesFor(lang: AcademyLang = 'es'): RegressionCase[] {
  if (lang !== 'en') return CASES
  return CASES.map((c) => ({ ...c, ...CASES_EN[c.id], area: AREAS_EN[AREAS.indexOf(c.area as (typeof AREAS)[number])] }))
}

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
export function runCase(
  state: ReleaseState,
  caseId: string,
  buildNo: number,
  build: ReleaseBuild = {},
  lang: AcademyLang = 'es',
): { state: ReleaseState; event: AppEvent; failed: boolean } {
  const c = casesFor(lang).find((x) => x.id === caseId)
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
      summary: bug
        ? `${c.id} ${c.title} → ${lang === 'en' ? 'FAILS' : 'FALLA'}: ${c.detects![bug]}`
        : `${c.id} ${c.title} → ${lang === 'en' ? 'PASSES' : 'PASA'} (${c.expected.toLowerCase()})`,
      technical: `TestHub · ${c.id} · build ${label} · ${bug ? 'FAILED' : 'PASSED'} · ${c.minutes} min`,
      status: bug ? 'error' : 'ok',
      bugs: bug ? [bug] : [],
      cost: c.minutes,
    },
  }
}

/** Relanza el test automático que falla en CI: es inestable (flaky), no un bug. */
export function rerunCi(state: ReleaseState, lang: AcademyLang = 'es'): { state: ReleaseState; event: AppEvent } {
  return {
    state: { ...state, ciReruns: state.ciReruns + 1 },
    event: {
      app: 'kobalto-release',
      action: 'ci_rerun',
      summary:
        lang === 'en'
          ? 'CI · reran test_export_csv_timeout → PASSES (in 3 of the last 10 builds it failed and passed on rerun: flaky test)'
          : 'CI · relanzado test_export_csv_timeout → PASA (3 de los últimos 10 builds falló y pasó al relanzar: test inestable)',
      technical: 'CI job #4182 · test_export_csv_timeout · PASSED (retry 1) · history: 3/10 flaky',
      status: 'ok',
      bugs: [],
      cost: 5,
    },
  }
}
