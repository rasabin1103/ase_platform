import type { Mission } from '../../../engine/types'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m05Lessons } from './m05-lessons'
import { m05Quiz } from './m05-quiz'
import { m05Scenes } from './m05-scenes'

/**
 * Curso 2: QA Profesional · Misión 5 — El plan (CTFL 5.1 y 5.2).
 * Guion legible: docs/academy/qa-profesional/missions/m05-plan.md
 *
 * Raúl necesita el plan de pruebas de la release 1.0 y una estimación
 * defendible para el comité de las 15:00, donde le pedirán hacerlo en la
 * mitad de tiempo.
 */
export const m05Plan: Mission = {
  id: 'm05-plan',
  courseKey: 'qa-profesional',
  number: 5,
  title: 'El plan',
  subtitle: 'Plan de pruebas, criterios de entrada y salida, estimación, riesgos, priorización y cuadrantes.',
  world: kobaltoWorld,
  playerRole: 'QA del squad Empresas',
  dayStart: 9 * 60,
  dayLabel: 'Viernes',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-plan',
  appLabel: 'Plan',
  hideBugList: true,
  initialMetrics: {},
  lessons: m05Lessons,
  mentor: 'laura',
  quiz: m05Quiz,
  verdicts: {
    good: {
      title: 'Un plan para decidir',
      body: 'Dirección aprueba la release con un alcance ajustado al riesgo y el equipo sabe qué probar, en qué orden y cuándo parar.',
    },
    ok: {
      title: 'Plan aprobado, con grietas',
      body: 'El plan pasó el comité, pero alguna pieza se va a notar en los sprints. Mira el debrief.',
    },
    bad: {
      title: 'Plan de papel',
      body: 'Sin criterios medibles ni una estimación defendible, el comité decidió por ti. Repite la misión empezando por la estimación.',
    },
  },

  briefing: {
    title: 'Viernes: el plan',
    paragraphs: [
      'La release 1.0 de Kobalto Empresas (cuentas, tarjetas de equipo y facturas recurrentes) se decide hoy a las 15:00 en el comité de dirección.',
      'Raúl necesita tu plan de pruebas y una estimación defendible. En la app «Plan» tienes el planificador: secciones del plan, riesgos, estimación, priorización y cuadrantes.',
      'Y prepárate: en los comités siempre piden hacerlo en menos tiempo.',
    ],
    goals: [
      'Completa el plan: alcance, enfoque y criterios de entrada y salida medibles.',
      'Separa los riesgos de producto de los de proyecto.',
      'Estima con ratio histórico y con tres puntos, y aplica Wideband Delphi con el equipo.',
      'Prioriza los casos por riesgo respetando dependencias, y coloca las pruebas en los cuadrantes.',
      'En el comité, defiende la estimación negociando alcance o riesgo.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }],

  scenes: m05Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'plantilla_plan',
      title: 'Plantilla del plan de pruebas',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'test_plan' },
        { kind: 'unlock', conceptId: 'entry_exit' },
      ],
      body: `## Contenido típico (CTFL 5.1.1)
- **Contexto**: alcance (qué entra y qué no), objetivos y base de prueba.
- **Supuestos y restricciones**.
- **Partes interesadas**: roles y responsabilidades.
- **Comunicación**: formas, frecuencia y plantillas.
- **Registro de riesgos**: de producto y de proyecto.
- **Enfoque**: niveles, tipos, técnicas, entregables, criterios de entrada y salida, independencia, métricas, datos y entornos.
- **Presupuesto y calendario**.

## Criterios de entrada y salida (CTFL 5.1.3)
- **Entrada**: precondiciones para empezar (recursos, testware, calidad inicial). Ej.: build estable en staging.
- **Salida**: qué hay que conseguir para dar por terminado (cobertura, defectos abiertos, riesgo residual). Deben ser **medibles**.
- En ágil, la salida suele ser la «definición de hecho» y la entrada, la «definición de listo».`,
    },
    {
      id: 'guia_estimacion',
      title: 'Guía de estimación y riesgos',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'estimation' },
        { kind: 'unlock', conceptId: 'risk_mgmt' },
      ],
      body: `## Técnicas de estimación (CTFL 5.1.4)
- **Por ratios**: con datos históricos (p. ej. pruebas = 40 % del esfuerzo de desarrollo).
- **Extrapolación**: a partir de las primeras medidas del propio proyecto.
- **Wideband Delphi**: estimaciones a ciegas; los extremos explican y se repite hasta converger. Planning poker es una variante.
- **Tres puntos**: E = (a + 4m + b) ÷ 6 y desviación estándar = (b − a) ÷ 6.

## Riesgos (CTFL 5.2)
- **De producto**: la calidad de lo que se entrega (funcionalidad, rendimiento, seguridad…).
- **De proyecto**: la gestión y el control (plazos, personas, proveedores, entornos).
- Nivel de riesgo = probabilidad × impacto. Respuestas: mitigar probando, aceptar, transferir o plan de contingencia.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'P-ALCANCE', title: 'Media semana probando la app móvil, que era de otro squad', severity: 'medium', explanation: 'Sin un alcance que diga qué entra y qué no, se prueba de todo.', technique: 'Alcance explícito: dentro y fuera.', preventedBy: 'plan.scope' },
    { id: 'P-ENFOQUE', title: 'Todas las pruebas manuales al final: los defectos llegan tarde', severity: 'medium', explanation: 'Sin un enfoque basado en riesgos y por niveles, todo se concentra al final.', technique: 'Enfoque por riesgos, niveles y automatización en CI.', preventedBy: 'plan.approach' },
    { id: 'P-ENTRADA', title: 'Se empieza a probar sin build estable: tres días perdidos', severity: 'medium', explanation: 'Sin criterios de entrada, se prueba sobre una base que cambia cada hora.', technique: 'Criterios de entrada concretos.', preventedBy: 'plan.entry' },
    { id: 'P-SALIDA', title: 'Nadie sabe cuándo parar: la release se alarga discutiendo si está lista', severity: 'high', explanation: 'Sin criterios de salida medibles, «listo» es una opinión.', technique: 'Criterios de salida medibles (cobertura, defectos, riesgo residual).', preventedBy: 'plan.exit' },
    { id: 'P-RIESGO', title: 'El retraso del proveedor de firma nadie lo gestiona y bloquea la release', severity: 'high', explanation: 'Un riesgo de proyecto tratado como de producto: se intentó «probar» en lugar de gestionarlo.', technique: 'Separar riesgos de producto y de proyecto.', preventedBy: 'plan.risks' },
    { id: 'P-PRIO', title: 'Congelar tarjetas se prueba el último día y no da tiempo', severity: 'high', explanation: 'Sin priorizar por riesgo, lo crítico quedó para el final.', technique: 'Priorización por riesgo respetando dependencias.', preventedBy: 'prio.ok' },
    { id: 'P-CUAD', title: 'Nadie planificó rendimiento ni seguridad', severity: 'medium', explanation: 'Los cuadrantes ayudan a no olvidar tipos de prueba; sin ellos, Q4 quedó vacío.', technique: 'Cuadrantes de testing.', preventedBy: 'quad.ok' },
    { id: 'P-ESTIM', title: 'Sprint desbordado: se aceptó la mitad de tiempo sin tocar el alcance', severity: 'critical', explanation: 'Sin una estimación defendida, el recorte cayó sobre la calidad.', technique: 'Estimación con método y negociación de alcance o riesgo.', preventedBy: 'est.defended' },
  ],

  prevention: {
    title: 'Tu plan',
    intro: 'Cada pieza del plan evita un problema concreto en los sprints de la release.',
    preventedLabel: 'Problemas que el plan evita',
    appearedLabel: 'Problemas que llegarán en los sprints',
    rules: [
      { flag: 'plan.scope', label: 'Alcance explícito', explanation: 'Qué entra y qué no.' },
      { flag: 'plan.approach', label: 'Enfoque basado en riesgos', explanation: 'Niveles, automatización en CI, BDD, exploratorias, rendimiento y seguridad.' },
      { flag: 'plan.entry', label: 'Criterios de entrada', explanation: 'Build en staging, historias con criterios y datos listos.' },
      { flag: 'plan.exit', label: 'Criterios de salida medibles', explanation: 'Riesgo alto probado, sin críticos abiertos y cobertura de ramas.' },
      { flag: 'plan.risks', label: 'Riesgos de producto y de proyecto separados', explanation: 'El proveedor, las vacaciones y staging son de proyecto: se gestionan, no se prueban.' },
      { flag: 'est.ok', label: 'Estimación con método', explanation: 'Ratio: 50 × 0,4 = 20. Tres puntos: E = 20, DE = 4.' },
      { flag: 'delphi.ok', label: 'Wideband Delphi', explanation: 'Los extremos explican y se repite la ronda.' },
      { flag: 'prio.ok', label: 'Prioridad por riesgo y dependencias', explanation: 'Congelar y alta primero; firma y facturas tras el alta; lo de riesgo bajo al final.' },
      { flag: 'quad.ok', label: 'Cuadrantes completos', explanation: 'Q1 unitarias e integración, Q2 BDD y prototipos, Q3 exploratorias y UAT, Q4 rendimiento y seguridad.' },
      { flag: 'est.defended', label: 'Estimación defendida en el comité', explanation: 'Se negoció el alcance según el riesgo.' },
    ],
  },

  concepts: [
    { id: 'test_plan', title: 'Plan de pruebas', summary: 'Describe objetivos, recursos y procesos: contexto, riesgos, enfoque, criterios, calendario. Sirve para comunicar y para decidir. (CTFL 5.1.1–5.1.2)' },
    { id: 'entry_exit', title: 'Criterios de entrada y salida', summary: 'Precondiciones para empezar y condiciones medibles para terminar. En ágil, «definición de listo» y «definición de hecho». (CTFL 5.1.3)' },
    { id: 'estimation', title: 'Estimación de pruebas', summary: 'Por ratios, extrapolación, Wideband Delphi y tres puntos (E = (a + 4m + b) ÷ 6). (CTFL 5.1.4)' },
    { id: 'prioritization', title: 'Priorización de casos', summary: 'Por riesgo, por cobertura o por requisitos, respetando dependencias. (CTFL 5.1.5)' },
    { id: 'quadrants', title: 'Pirámide y cuadrantes de testing', summary: 'La pirámide reparte la automatización por niveles; los cuadrantes clasifican las pruebas según negocio o tecnología y según apoyen al equipo o critiquen el producto. (CTFL 5.1.6–5.1.7)' },
    { id: 'risk_mgmt', title: 'Gestión de riesgos', summary: 'Riesgos de producto y de proyecto; nivel = probabilidad × impacto; mitigar, aceptar, transferir o plan de contingencia. (CTFL 5.2)' },
  ],
  debriefConcepts: ['test_plan', 'entry_exit', 'estimation', 'prioritization', 'quadrants', 'risk_mgmt'],
  seniorTips: [
    'Alcance con dentro y fuera; enfoque por riesgos; entrada con build estable y datos; salida medible.',
    'Riesgos de proyecto: proveedor de firma, vacaciones y staging compartido. De producto: IVA, rendimiento y tarjeta congelada.',
    'Ratio: 50 × 0,4 = 20. Tres puntos: (12 + 72 + 36) ÷ 6 = 20; DE = (36 − 12) ÷ 6 = 4.',
    'En Delphi, que expliquen los extremos y repetid a ciegas.',
    'Orden: congelar (alto), alta de cuenta (requisito), firma y facturas (altos), y al final CSV e idioma.',
    'En el comité: con la mitad de tiempo, se recorta alcance según riesgo o se acepta el riesgo por escrito.',
  ],
}
