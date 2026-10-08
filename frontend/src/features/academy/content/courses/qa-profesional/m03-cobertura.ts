import type { Mission } from '../../../engine/types'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m03Lessons } from './m03-lessons'
import { m03Quiz } from './m03-quiz'
import { m03Scenes } from './m03-scenes'

/**
 * Curso 2: QA Profesional · Misión 3 — Dentro del código (CTFL 4.3 y 2.2).
 * Guion legible: docs/academy/qa-profesional/missions/m03-cobertura.md
 *
 * Tomás presume de «100 % de cobertura» en el cálculo de facturas, pero hay un
 * bug en producción. El jugador lee el código, ejecuta la suite con cobertura
 * de sentencias y de ramas, descubre que el único test que pasa por el bug no
 * comprueba nada, lo arregla, cubre la rama que faltaba y reporta lo que
 * encuentra.
 */
export const m03Cobertura: Mission = {
  id: 'm03-cobertura',
  courseKey: 'qa-profesional',
  number: 3,
  title: 'Dentro del código',
  subtitle: 'Caja blanca: cobertura de sentencias y de ramas, y lo que la cobertura no mide.',
  world: kobaltoWorld,
  playerRole: 'QA del squad Empresas',
  dayStart: 9 * 60,
  dayLabel: 'Miércoles',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-coverage',
  appLabel: 'Cobertura',
  initialMetrics: {},
  lessons: m03Lessons,
  mentor: 'laura',
  quiz: m03Quiz,
  verdicts: {
    good: {
      title: 'La cobertura bien leída',
      body: 'Encontraste lo que el «100 %» escondía, y el squad ya no confunde cobertura con calidad.',
    },
    ok: {
      title: 'Bug encontrado, lección a medias',
      body: 'Diste con parte de lo que fallaba, pero algo de la cobertura o de las aserciones se quedó por el camino. Mira el debrief.',
    },
    bad: {
      title: 'El 100 % que no decía nada',
      body: 'Los bugs siguen en producción. Repite la misión empezando por la suite de Tomás: ¿qué comprueba cada caso?',
    },
  },

  briefing: {
    title: 'Miércoles: dentro del código',
    paragraphs: [
      'Carmen ha recibido quejas: algunas facturas a empresas salen con una retención de IRPF de risa. Tomás asegura que el módulo de cálculo tiene «100 % de cobertura».',
      'Hoy toca caja blanca. Tienes el código del cálculo y la suite de pruebas de componente de Tomás en la app «Cobertura»: puedes editar y añadir casos y ejecutar la suite para ver qué líneas y qué ramas se recorren.',
      'Ojo: la cobertura dice qué se ha ejecutado, no si alguien ha comprobado el resultado.',
    ],
    goals: [
      'No te quedes en el «100 %»: averigua qué mide de verdad.',
      'Encuentra por qué la suite no detecta el bug de Carmen y escribe un caso que falle.',
      'Lleva la suite al 100 % de ramas, no solo de sentencias.',
      'Reporta en el tablero cada bug que encuentres, con la ejecución como evidencia.',
      'Propón a Raúl un uso sensato de la cobertura en el pipeline.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }, { tool: 'tickets' }],

  scenes: m03Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'spec_calculo',
      title: 'Especificación del cálculo de facturas',
      updatedLabel: 'Elena Prieto · producto',
      readCost: 5,
      onRead: [{ kind: 'flag', key: 'spec.read' }],
      body: `## Total de la factura
**Total = base + IVA − IRPF**, cada importe redondeado al céntimo.

- **IVA**: 21 % de la base.
- **IRPF** (retención): solo si el **cliente es una empresa**.
  - Emisor con **menos de 3 años** de alta: **7 %**.
  - Emisor con **3 años o más**: **15 %**.
- Cliente particular: sin retención.

## Revisión
Las facturas con base de **3.000 € o más** se marcan para revisión manual de Compliance.

## Ejemplo
Base 1.000 €, cliente empresa, emisor con 5 años: IVA 210 €, IRPF 150 €, total **1.060 €**, sin revisión.`,
    },
    {
      id: 'guia_cobertura',
      title: 'Cobertura de código: qué mide y qué no',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 3,
      onRead: [
        { kind: 'unlock', conceptId: 'statement_cov' },
        { kind: 'unlock', conceptId: 'branch_cov' },
      ],
      body: `## Cobertura de sentencias
Sentencias ejecutadas ÷ sentencias ejecutables. 100 % significa que cada línea se ejecutó al menos una vez.

## Cobertura de ramas
Ramas ejecutadas ÷ ramas totales. Cada decisión tiene una rama verdadera y otra falsa, aunque la falsa no tenga código («si» sin «sino»).
- 100 % de ramas implica 100 % de sentencias; al revés, no.

## Lo que no mide
- Si el test **comprueba** el resultado: un test sin aserción también «cubre».
- Si el código hace **lo que dice la especificación**: un resultado esperado copiado del código pasa siempre.
- Lo que **falta** en el código: un requisito no implementado no tiene líneas que cubrir.`,
    },
  ],

  tickets: [
    {
      id: 'KOB-E-31',
      title: 'Quejas por retenciones de IRPF incorrectas en facturas a empresas',
      status: 'En análisis',
      type: 'bug',
      description: 'Tres clientes autónomos con años de antigüedad reportan retenciones de alrededor del 1,5 % en facturas a empresas. Tomás sostiene que el cálculo está cubierto al 100 %.',
      acceptanceCriteria: ['Se identifica la causa con un caso de prueba que falla.', 'La suite de componente comprueba el resultado en todas las ramas del cálculo.'],
      comments: [{ author: 'tomas', body: 'El informe de cobertura dice 100 %. Mirad el PDF.' }],
      actions: [],
    },
  ],

  bugs: [
    {
      id: 'B-RET',
      title: 'La retención es del 1,5 % en lugar del 15 % para emisores con 3 años o más de alta',
      severity: 'high',
      explanation: 'La rama «sino» del cálculo usa 0,015 en vez de 0,15. El caso #3 de Tomás pasaba por esa línea (100 % de sentencias), pero no comprobaba el resultado.',
      technique: 'Cobertura de sentencias + aserción con el resultado esperado de la especificación.',
      fix: { delay: 45, note: 'Corregido: retención del 15 % en la rama «sino». Gracias por el caso que falla.' },
    },
    {
      id: 'B-REV',
      title: 'Una factura de 3.000 € justos no se marca para revisión',
      severity: 'medium',
      explanation: 'El código usa «base > 3000» y la especificación dice «3.000 € o más». Solo se ve recorriendo la rama falsa de esa decisión con el valor límite.',
      technique: 'Cobertura de ramas + valor límite (3.000 €).',
      fix: { delay: 30, note: 'Cambiado a «base ≥ 3000».' },
    },
  ],

  concepts: [
    { id: 'white_box', title: 'Pruebas de caja blanca', summary: 'Se basan en la estructura interna (el código). Miden la cobertura y encuentran lo que no se ha probado, pero no detectan requisitos que faltan. (CTFL 4.3.3)' },
    { id: 'statement_cov', title: 'Cobertura de sentencias', summary: 'Sentencias ejecutadas ÷ sentencias ejecutables. 100 % garantiza que cada línea se ejecutó, no que se comprobara ni que se probaran todas las ramas. (CTFL 4.3.1)' },
    { id: 'branch_cov', title: 'Cobertura de ramas', summary: 'Ramas ejecutadas ÷ ramas totales, incluidas las falsas sin código. 100 % de ramas implica 100 % de sentencias, pero no al revés. (CTFL 4.3.2)' },
    { id: 'coverage_limits', title: 'Lo que la cobertura no mide', summary: 'Un test sin aserción o con el resultado copiado del código también cubre. La cobertura indica lo no probado; no es una medida de calidad.' },
    { id: 'component_testing', title: 'Pruebas de componente', summary: 'Prueban componentes aislados, normalmente las escriben los desarrolladores y se apoyan en la cobertura del código. (CTFL 2.2.1)' },
  ],
  debriefConcepts: ['white_box', 'statement_cov', 'branch_cov', 'coverage_limits', 'component_testing'],
  seniorTips: [
    'En la reunión: 100 % de sentencias no dice si se comprobó el resultado ni si se recorrieron todas las ramas.',
    'Ejecuta la suite primero: verás 100 % de sentencias y 83 % de ramas (falta la rama falsa de «si base > 3000»).',
    'El caso #3 de Tomás pasa por la línea del bug sin comprobar nada: marca «Comprueba» y pon el resultado de la especificación (4.000 € empresa, 5 años: 4.240 €, revisión sí).',
    'Añade un caso con base de 3.000 € justos: cubre la rama falsa y destapa el segundo bug (revisión esperada: sí).',
    'Calcula el resultado esperado con la especificación, nunca copiándolo de lo que devuelve el código.',
    'Reporta cada bug con la ejecución como evidencia; cuando Tomás despliegue la corrección, vuelve a ejecutar la suite y verifica el fix en el tablero.',
  ],
}
