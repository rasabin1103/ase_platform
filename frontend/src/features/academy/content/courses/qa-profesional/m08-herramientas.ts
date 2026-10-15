import type { Mission } from '../../../engine/types'
import { kobaltoWorld } from '../../worlds/kobalto'
import { m08Lessons } from './m08-lessons'
import { m08Quiz } from './m08-quiz'
import { m08Scenes } from './m08-scenes'

/**
 * Curso 2: QA Profesional · Misión 8 — Herramientas (CTFL 6.1 y 6.2).
 * Guion legible: docs/academy/qa-profesional/missions/m08-herramientas.md
 *
 * Raúl tiene presupuesto para herramientas, tres proveedores han hecho demo
 * y Sergio empuja por la suya. Cierra el curso con la retro del squad.
 */
export const m08Herramientas: Mission = {
  id: 'm08-herramientas',
  courseKey: 'qa-profesional',
  number: 8,
  title: 'Herramientas',
  subtitle: 'Tipos de herramientas de prueba, beneficios y riesgos de la automatización, evaluación y piloto.',
  world: kobaltoWorld,
  playerRole: 'QA del squad Empresas',
  dayStart: 9 * 60,
  dayLabel: 'Jueves',
  duration: 480,
  appActionCost: 5,
  reportCost: 10,
  reportReviewer: 'tomas',
  ticketPrefix: 'EMP',
  appId: 'kobalto-tools',
  appLabel: 'Herramientas',
  hideBugList: true,
  initialMetrics: {},
  lessons: m08Lessons,
  mentor: 'laura',
  quiz: m08Quiz,
  verdicts: {
    good: {
      title: 'Herramientas con criterio',
      body: 'El squad adopta una herramienta que resuelve sus necesidades, con un piloto medible y expectativas realistas. El proceso de calidad está completo.',
    },
    ok: {
      title: 'Buena compra, con letra pequeña',
      body: 'La decisión es razonable, pero algún riesgo de la automatización se va a notar. Mira el debrief.',
    },
    bad: {
      title: 'Comprar una demo',
      body: 'Se eligió por la demo y por la prisa, no por las necesidades. Repite la misión empezando por clasificar las necesidades.',
    },
  },

  briefing: {
    title: 'Jueves: herramientas',
    paragraphs: [
      'Dirección aprueba 20.000 € al año para herramientas de pruebas del squad Empresas. A las 15:00 se decide en qué gastarlos.',
      'Tres proveedores han hecho demo esta semana y Sergio, de QA Automation, está entusiasmado con una. En la app «Herramientas» tienes las necesidades del squad y las fichas de las candidatas.',
      'Es la última misión del curso: al final del día, retro del squad sobre todo lo construido.',
    ],
    goals: [
      'Clasifica cada necesidad del squad por tipo de herramienta.',
      'Identifica los riesgos de cada candidata: expectativas, mantenimiento, dependencia, CI y aprendizaje.',
      'Elige la candidata para el piloto y define alcance y criterios de éxito medibles.',
      'Frena la compra por impulso y defiende la propuesta en el comité.',
    ],
  },

  tools: [{ tool: 'mail' }, { tool: 'chat' }, { tool: 'wiki' }, { tool: 'app' }],

  scenes: m08Scenes,
  endSceneId: 'closing',

  docs: [
    {
      id: 'guia_herramientas',
      title: 'Tipos de herramientas de prueba',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [{ kind: 'unlock', conceptId: 'tool_categories' }],
      body: `## Categorías (CTFL 6.1)
- **Gestión**: proceso, requisitos, pruebas, defectos, configuración y trazabilidad.
- **Pruebas estáticas**: revisiones y análisis estático del código.
- **Diseño e implementación**: generar casos, datos y procedimientos.
- **Ejecución y cobertura**: ejecutar pruebas automatizadas y medir la cobertura.
- **No funcionales**: rendimiento, carga, seguridad, usabilidad…
- **DevOps**: el pipeline de entrega, el seguimiento del flujo, builds automáticas, CI/CD.
- **Colaboración**: comunicación entre roles y equipos.
- También: escalabilidad y estandarización del despliegue (máquinas virtuales, contenedores) y cualquier herramienta que ayude a probar (una hoja de cálculo también lo es).`,
    },
    {
      id: 'guia_automatizacion',
      title: 'Automatización: beneficios, riesgos y adopción',
      updatedLabel: 'Mantenida por Laura Méndez',
      readCost: 5,
      onRead: [
        { kind: 'unlock', conceptId: 'automation_benefits' },
        { kind: 'unlock', conceptId: 'automation_risks' },
        { kind: 'unlock', conceptId: 'tool_pilot' },
      ],
      body: `## Beneficios (CTFL 6.2)
- Ahorro de tiempo en tareas repetitivas (regresión, reintroducir datos, comparar resultados).
- Menos errores humanos y más consistencia y repetibilidad.
- Evaluación más objetiva (cobertura) y medidas que serían difíciles de obtener a mano.
- Acceso más sencillo a la información de las pruebas para gestionarlas e informar.
- Ejecución más rápida: detección temprana, feedback y tiempo de salida al mercado.
- Más tiempo para diseñar pruebas nuevas y más profundas.

## Riesgos (CTFL 6.2)
- **Expectativas irreales** sobre lo que hace la herramienta.
- Estimar mal el tiempo, el coste y el esfuerzo de introducirla, mantener los scripts y cambiar el proceso.
- Usarla cuando las pruebas manuales son más adecuadas.
- Confiar demasiado en ella e ignorar el pensamiento crítico.
- **Dependencia del proveedor**: que cierre, retire la herramienta, la venda o dé mal soporte.
- Software libre abandonado o que exige actualizaciones frecuentes.
- **Incompatibilidad** con la plataforma de desarrollo o el CI.
- No cumplir requisitos normativos o de seguridad.

## Adopción (buena práctica)
Antes de extenderla: un **piloto** acotado, con formación y **criterios de éxito medibles**, y una decisión al final. Coste total a varios años, no solo la licencia.`,
    },
  ],

  tickets: [],

  bugs: [
    { id: 'P-CATEGORIA', title: 'Se compra una herramienta de ejecución y la trazabilidad sigue en tres Excel', severity: 'medium', explanation: 'Se eligió sin clasificar las necesidades por tipo de herramienta.', technique: 'Necesidad → categoría → candidatas.', preventedBy: 'needs.ok' },
    { id: 'P-RIESGOS', title: 'Nadie previó la formación: el piloto se atasca dos semanas', severity: 'medium', explanation: 'No se evaluaron los riesgos de cada candidata.', technique: 'Evaluar mantenimiento, dependencia, integración y aprendizaje.', preventedBy: 'eval.ok' },
    { id: 'P-FRAGIL', title: 'Los scripts grabados se rompen en cada cambio de interfaz', severity: 'high', explanation: 'Se eligió por la demo, sin contar el coste de mantenimiento.', technique: 'Coste total y nivel de las pruebas (API frente a interfaz).', preventedBy: 'choice.ok' },
    { id: 'P-PILOTO', title: 'Adopción en todo el squad sin piloto: nadie sabe si funcionó', severity: 'high', explanation: 'Sin alcance acotado ni criterios medibles no hay decisión posible.', technique: 'Piloto con criterios de éxito medibles y fecha de decisión.', preventedBy: 'pilot.ok' },
    { id: 'P-PRISA', title: 'Se firmaron tres años de licencia antes de evaluar', severity: 'high', explanation: 'El descuento por firmar hoy pesó más que la evaluación.', technique: 'Evaluar y pilotar antes de comprometer presupuesto.', preventedBy: 'sergio.aligned' },
    { id: 'P-EXPECTATIVAS', title: 'Dirección esperaba el 100 % automatizado en un mes y recorta el presupuesto', severity: 'critical', explanation: 'Expectativas irreales sobre la automatización.', technique: 'Propuesta gradual, con beneficios y riesgos explícitos.', preventedBy: 'proposal.defended' },
  ],

  prevention: {
    title: 'Tu estrategia de herramientas',
    intro: 'Cada paso de la selección evita un problema concreto en la adopción.',
    preventedLabel: 'Problemas que evitas',
    appearedLabel: 'Problemas que llegarán',
    rules: [
      { flag: 'needs.ok', label: 'Necesidades clasificadas', explanation: 'Gestión, estáticas, diseño, ejecución, no funcionales, DevOps y colaboración.' },
      { flag: 'eval.ok', label: 'Riesgos evaluados', explanation: 'TestForge: expectativas y mantenimiento. QualiCloud: dependencia y CI. Kestrel: aprendizaje.' },
      { flag: 'choice.ok', label: 'Candidata adecuada', explanation: 'Kestrel: pruebas de API en el repo, integrada con el CI y sin licencia.' },
      { flag: 'pilot.ok', label: 'Piloto medible', explanation: '4 semanas, regresión de facturas en cada merge, menos del 5 % inestables y equipo autónomo.' },
      { flag: 'sergio.aligned', label: 'Compra por impulso frenada', explanation: 'Sergio se suma al piloto en lugar de firmar hoy.' },
      { flag: 'proposal.defended', label: 'Propuesta defendida', explanation: 'Adopción gradual con expectativas realistas.' },
    ],
  },

  concepts: [
    { id: 'tool_categories', title: 'Tipos de herramientas de prueba', summary: 'Gestión, estáticas, diseño e implementación, ejecución y cobertura, no funcionales, DevOps y colaboración. (CTFL 6.1)' },
    { id: 'automation_benefits', title: 'Beneficios de la automatización', summary: 'Ahorro en tareas repetitivas, consistencia, medidas objetivas, feedback más rápido y más tiempo para diseñar pruebas. (CTFL 6.2)' },
    { id: 'automation_risks', title: 'Riesgos de la automatización', summary: 'Expectativas irreales, coste de mantenimiento mal estimado, exceso de confianza, dependencia del proveedor e incompatibilidad con la plataforma. (CTFL 6.2)' },
    { id: 'tool_pilot', title: 'Piloto de herramientas', summary: 'Probar la herramienta en un alcance acotado, con formación y criterios de éxito medibles, antes de extenderla. Buena práctica de adopción (no examinable en CTFL v4.0).' },
  ],
  debriefConcepts: ['tool_categories', 'automation_benefits', 'automation_risks', 'tool_pilot'],
  seniorTips: [
    'N1 gestión, N2 estáticas, N3 diseño e implementación, N4 ejecución y cobertura, N5 no funcionales, N6 DevOps, N7 colaboración.',
    'TestForge: expectativas irreales y mantenimiento. QualiCloud: dependencia del proveedor y sin CI. Kestrel: curva de aprendizaje.',
    'Piloto de 4 semanas con Kestrel en la API de facturas; criterios: CI en menos de 10 min, menos del 5 % inestables, equipo autónomo.',
    'Un descuento por firmar hoy no sustituye a la evaluación.',
    'La automatización no sustituye a la exploratoria ni al criterio del equipo.',
  ],
}
