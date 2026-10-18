import type { Mission } from '../../../engine/types'
import { kobaltoApiWorld } from '../../worlds/kobaltoApi'
import { m08Lab } from './m08-lab'
import { m08Lessons } from './m08-lessons'
import { m08Quiz } from './m08-quiz'
import { m08Scenes } from './m08-scenes'
import { API_REFERENCE_DOC } from './shared'

/**
 * Curso 3: Karate Framework · Misión 9 — Verde en el pipeline.
 * Guion legible: docs/academy/karate-framework/missions/m08-pipeline.md
 *
 * Runners JUnit 5 (Runner.path…tags…parallel) que deciden el build, smoke con
 * tags en cada PR, ejecución en paralelo con orden cambiante, datos propios
 * por escenario y tests inestables: unos por el test, otros por la API.
 */
export const m08Pipeline: Mission = {
  id: 'm08-pipeline',
  courseKey: 'karate-framework',
  number: 8,
  title: 'Verde en el pipeline',
  subtitle: 'Runners JUnit 5, assert de fallos, tags @smoke, parallel(), datos propios, tests inestables e informes.',
  world: kobaltoApiWorld,
  playerRole: 'QA Automation · Open API',
  dayStart: 9 * 60,
  dayLabel: 'Jueves',
  duration: 480,
  appActionCost: 3,
  reportCost: 10,
  verifyCost: 5,
  reportReviewer: 'nico',
  ticketPrefix: 'API',
  appId: 'karate-ide',
  appLabel: 'IDE Karate',
  codeLab: m08Lab,
  initialMetrics: {},
  lessons: m08Lessons,
  mentor: 'sergio',
  quiz: m08Quiz,
  verdicts: {
    good: {
      title: 'Verde de verdad',
      body: 'Tu pipeline falla cuando algo falla, da una señal rápida en cada PR y es estable en paralelo. Y supiste distinguir un test inestable de una API que falla con concurrencia.',
    },
    ok: {
      title: 'Verde, casi siempre',
      body: 'El pipeline mejoró, pero sigue habiendo un verde que no es verde, un smoke lento o un test que falla a veces. Mira el debrief.',
    },
    bad: {
      title: 'Verde de mentira',
      body: 'Un pipeline que no falla o que falla al azar no protege nada. Repite la misión empezando por la lección «¿Cómo hago que el pipeline falle si falla un test?».',
    },
  },

  briefing: {
    title: 'Jueves: el pipeline',
    paragraphs: [
      'El job nocturno salió verde con escenarios en rojo, y el test del saldo falla a veces desde que Sergio puso la suite en paralelo.',
      'Los devs quieren un smoke en cada pull request que tarde segundos, y el viernes la 1.7 sube a producción con Finvo llamando en paralelo.',
      'Hoy haces que verde signifique verde: el runner, los tags, los datos de cada escenario y la estabilidad.',
    ],
    goals: [
      'En el stand-up, decide qué hacer con un test que falla a veces.',
      'Haz que el nocturno rompa el build cuando algo falla.',
      'Monta el smoke de las PR con @smoke, en menos de 3 s.',
      'Arregla el test del saldo con datos propios.',
      'Consigue tres noches seguidas sin fallos de los tests.',
      'Decide con datos si la 1.7 sube a producción el viernes.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m08Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'ci',
      title: 'Pipeline de CI de la Open API',
      updatedLabel: 'Mantenida por Sergio Navas',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'runner' },
        { kind: 'flag', key: 'doc.ci' },
      ],
      body: `## Jobs
- **PR · smoke**: en cada pull request. \`mvn test -Dtest=SmokeRunner\`. Presupuesto: **menos de 3 s**. Solo escenarios **@smoke**.
- **Nocturno · regresión**: cada noche a las 02:00. \`mvn test -Dtest=OpenApiRunner\`. Toda la suite (menos @ignore), en **paralelo**.
- El build es rojo si el test JUnit falla. Karate no hace fallar el test por sí solo: el runner tiene que comprobar \`results.getFailCount()\`.

## Informes
- HTML de Karate en target/karate-reports (se publica como artefacto del job).
- \`.outputCucumberJson(true)\`: JSON de Cucumber para Xray. \`.outputJunitXml(true)\`: XML de JUnit.

## Datos en el sandbox
- **POST /sandbox/accounts** { balance, currency } → **201** con una cuenta de pruebas nueva (ACC-9001, ACC-9002…), activa, solo para esa ejecución.
- Úsalas para todo lo que compruebe saldos exactos: ACC-1001 la usan muchos tests a la vez.

## Reglas de saldo (1.7)
- El saldo se comprueba al **crear** y otra vez al **confirmar**: una confirmación que supera el saldo disponible en ese momento recibe **422 INSUFFICIENT_FUNDS**.
- Los ids de transferencia son únicos (TRF-…), también con peticiones simultáneas.`,
    },
    API_REFERENCE_DOC,
  ],

  tickets: [
    {
      id: 'API-47',
      title: 'Pipeline fiable para la Open API',
      status: 'En curso',
      type: 'story',
      description: 'Como equipo, queremos un pipeline cuyo verde signifique que la API funciona, para subir a producción con confianza.',
      acceptanceCriteria: ['El nocturno falla si falla un escenario.', 'Smoke en cada PR en menos de 3 s.', 'Tres noches seguidas sin fallos de los tests antes de subir.'],
      comments: [{ author: 'sergio', body: 'Nocturno en paralelo con 4 hilos desde ayer.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'KA-SEQ',
      title: 'Dos transferencias creadas a la vez reciben el mismo id',
      severity: 'critical',
      explanation: 'El id de transferencia se generaba a partir de la hora (con resolución de 25 ms). Con peticiones simultáneas, dos transferencias compartían id y la segunda pisaba a la primera: un cliente podía ver o confirmar la transferencia de otro.',
      technique: 'Ejecución en paralelo repetida con datos propios: el fallo aparece solo con concurrencia y el escenario, ejecutado solo, pasa.',
      fix: { delay: 90, note: 'Los ids salen de una secuencia de base de datos. Desplegado en sandbox.' },
      repro: { groups: [['paralel', 'simultáne', 'a la vez', 'hilo', 'concurren'], ['mismo id', 'id', 'pisa', 'duplicad', '409']], ask: '¿Qué pasaba a la vez y qué tenían en común las dos transferencias?' },
    },
    {
      id: 'KA-RESERVA',
      title: 'Confirmar dos transferencias pendientes deja la cuenta en negativo',
      severity: 'high',
      explanation: 'El saldo solo se comprobaba al crear la transferencia: dos pendientes que juntas superaban el saldo se confirmaban las dos y la cuenta quedaba en negativo.',
      technique: 'Cuenta propia con saldo conocido, dos transferencias que juntas lo superan y confirmar ambas (la segunda: 422).',
      fix: { delay: 60, note: 'Confirmar comprueba ya el saldo disponible. Desplegado.' },
      repro: { groups: [['dos', 'pendiente', 'segunda'], ['negativo', '202', '422', 'saldo']], ask: '¿Con qué saldo empezaste y qué respondió la segunda confirmación?' },
    },
  ],

  prevention: {
    title: 'Tus retos',
    intro: 'Cómo quedó el pipeline al terminar el día.',
    preventedLabel: 'Bugs evitados',
    appearedLabel: 'Bugs que aparecieron',
    rules: [
      { flag: 'reto.assert', label: 'El nocturno rompe el build', explanation: 'assertEquals(0, results.getFailCount(), results.getErrorMessages()).' },
      { flag: 'reto.smoke', label: 'Smoke de PR en segundos', explanation: '@smoke en lo imprescindible y SmokeRunner con .tags("@smoke").' },
      { flag: 'reto.aislado', label: 'Datos propios', explanation: 'El test del saldo crea su cuenta con POST /sandbox/accounts.' },
      { flag: 'reto.estable', label: 'Tres noches seguidas', explanation: 'Nocturno en paralelo sin fallos achacables a los tests, tres veces.' },
      { flag: 'reto.reserva', label: 'Dos pendientes, un saldo', explanation: 'La segunda confirmación que supera el saldo recibe 422.' },
      { flag: 'reto.informe', label: 'Resultados en Xray', explanation: '.outputCucumberJson(true) en el runner nocturno.' },
    ],
  },

  concepts: [
    { id: 'runner', title: 'Runners y build', summary: 'Runner.path(…).tags(…).parallel(n) ejecuta y devuelve resultados; el assert sobre getFailCount() es lo que hace fallar el build. Tags para separar smoke y regresión; informes Cucumber JSON y JUnit XML.' },
    { id: 'paralelo', title: 'Paralelo y datos propios', summary: 'En paralelo el orden cambia en cada ejecución: cada escenario crea y comprueba solo sus datos.' },
    { id: 'flaky', title: 'Tests inestables', summary: 'Tienen causa: datos compartidos, esperas fijas… o la aplicación con concurrencia. Se investigan; reintentar hasta que pase lo esconde.' },
  ],
  debriefConcepts: ['runner', 'paralelo', 'flaky'],
  seniorTips: [
    'Lee «Pipeline de CI» en la wiki: jobs, presupuesto del smoke, cuentas de prueba y reglas de saldo.',
    'OpenApiRunner: import static org.junit.jupiter.api.Assertions.*; y assertEquals(0, results.getFailCount(), results.getErrorMessages());',
    '@smoke en los tres escenarios de cuentas y lanza el job «PR · smoke».',
    "Saldo con datos propios: POST /sandbox/accounts { balance: 100 }, transfiere 10 desde esa cuenta y espera available == 90.",
    'Lanza el nocturno varias veces: lo que siga fallando a veces con datos propios, mira si es la API (ids repetidos) y repórtalo.',
    'Carmen: cuenta de 100, dos transferencias de 80, confirma las dos → la segunda 422.',
    'Alba: .outputCucumberJson(true) antes de .parallel(…).',
  ],
}
