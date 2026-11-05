/** Copy de la página pública «Servicios» (/consulting): consultoría QA y frameworks. */

export type ConsultingAccent = 'sky' | 'emerald' | 'amber' | 'violet'

export interface ConsultingLayer {
  tag: string
  title: string
  text: string
}

export interface ConsultingService {
  id: string
  accent: ConsultingAccent
  short: string
  eyebrow: string
  title: string
  summary: string
  layers: ConsultingLayer[]
  outcomesTitle: string
  outcomes: string[]
}

export interface ConsultingCopy {
  meta: { title: string; description: string }
  hero: {
    eyebrow: string
    title: string
    subtitle: string
    cta: string
    ctaSecondary: string
    stackLabel: string
    hint: string
  }
  scrollHint: string
  services: ConsultingService[]
  process: {
    eyebrow: string
    title: string
    subtitle: string
    steps: { title: string; text: string }[]
  }
  cta: { title: string; text: string; button: string; secondary: string }
}

export const consultingPageEs: ConsultingCopy = {
  meta: {
    title: 'Servicios de consultoría QA y frameworks de automatización',
    description:
      'Estrategia de QA, arquitectura de calidad, frameworks de automatización y CI/CD con quality gates. Explora cada servicio capa a capa y cuéntanos tu proyecto.',
  },
  hero: {
    eyebrow: 'Servicios',
    title: 'Calidad de software, capa a capa',
    subtitle:
      'Consultoría y frameworks de QA: desde la estrategia hasta la automatización dentro de tu pipeline. Despliega cada servicio y mira qué hay dentro.',
    cta: 'Hablemos de tu proyecto',
    ctaSecondary: 'Ver qué incluye ASE',
    stackLabel: 'Los cuatro servicios apilados como capas de una misma práctica de calidad',
    hint: 'Pasa el ratón o enfoca una capa para resaltarla',
  },
  scrollHint: 'Desplázate para abrir el servicio',
  services: [
    {
      id: 'estrategia',
      accent: 'sky',
      short: 'Estrategia QA',
      eyebrow: '01 · Estrategia',
      title: 'Estrategia y auditoría de calidad',
      summary:
        'Partimos de cómo trabajáis hoy para decidir qué probar, con qué prioridad y cómo medir si mejora. Sin plantillas genéricas.',
      layers: [
        {
          tag: 'Entender',
          title: 'Diagnóstico',
          text: 'Revisamos procesos, pruebas existentes, incidencias y el contexto del producto.',
        },
        {
          tag: 'Priorizar',
          title: 'Riesgos',
          text: 'Ordenamos qué probar según el impacto y la probabilidad de fallo.',
        },
        {
          tag: 'Definir',
          title: 'Estrategia de pruebas',
          text: 'Niveles de prueba, responsabilidades, entornos y criterios de salida.',
        },
        {
          tag: 'Planificar',
          title: 'Hoja de ruta',
          text: 'Un plan por fases con métricas para comprobar el avance.',
        },
      ],
      outcomesTitle: 'Qué te llevas',
      outcomes: [
        'Mapa de riesgos y cobertura',
        'Estrategia de pruebas documentada',
        'Hoja de ruta priorizada por fases',
        'Métricas de calidad acordadas',
      ],
    },
    {
      id: 'arquitectura',
      accent: 'emerald',
      short: 'Arquitectura de calidad',
      eyebrow: '02 · Arquitectura',
      title: 'Arquitectura de calidad',
      summary:
        'Diseñamos cómo encajan las pruebas en tu sistema: qué se prueba en cada nivel, con qué herramientas y con qué datos.',
      layers: [
        {
          tag: 'Niveles',
          title: 'Pirámide de pruebas',
          text: 'Qué cubre cada nivel: unitarias, de API, de interfaz y de extremo a extremo.',
        },
        {
          tag: 'Integración',
          title: 'Contratos e integración',
          text: 'Pruebas de contrato entre servicios para detectar cambios que rompen consumidores.',
        },
        {
          tag: 'Soporte',
          title: 'Datos y entornos',
          text: 'Datos de prueba controlados y entornos reproducibles.',
        },
        {
          tag: 'Visibilidad',
          title: 'Observabilidad',
          text: 'Métricas, trazas y registros que enlazan fallos de prueba con causas.',
        },
      ],
      outcomesTitle: 'Qué te llevas',
      outcomes: [
        'Arquitectura de pruebas por niveles',
        'Selección justificada de herramientas',
        'Modelo de datos y entornos de prueba',
        'Criterios de calidad por componente',
      ],
    },
    {
      id: 'frameworks',
      accent: 'amber',
      short: 'Frameworks',
      eyebrow: '03 · Frameworks',
      title: 'Frameworks de automatización',
      summary:
        'Construimos un framework mantenible para API, interfaz o móvil, con estructura clara para que tu equipo lo haga crecer.',
      layers: [
        {
          tag: 'Capa 1',
          title: 'Casos de prueba',
          text: 'Escenarios legibles, independientes y fáciles de mantener.',
        },
        {
          tag: 'Capa 2',
          title: 'Clientes y page objects',
          text: 'Acciones reutilizables que aíslan los cambios de la aplicación.',
        },
        {
          tag: 'Capa 3',
          title: 'Núcleo del framework',
          text: 'Configuración, gestión de datos, esperas y utilidades comunes.',
        },
        {
          tag: 'Capa 4',
          title: 'Informes',
          text: 'Resultados claros con evidencias para depurar rápido.',
        },
        {
          tag: 'Capa 5',
          title: 'Ejecución en CI',
          text: 'Ejecución repetible y paralelizable en tu pipeline.',
        },
      ],
      outcomesTitle: 'Qué te llevas',
      outcomes: [
        'Repositorio estructurado y documentado',
        'Guía de buenas prácticas para el equipo',
        'Primeros casos automatizados de ejemplo',
        'Traspaso y acompañamiento al equipo',
      ],
    },
    {
      id: 'cicd',
      accent: 'violet',
      short: 'CI/CD y gates',
      eyebrow: '04 · CI/CD',
      title: 'CI/CD y quality gates',
      summary:
        'Llevamos la calidad al pipeline: controles automáticos en cada paso para que lo que llega a producción cumpla lo acordado.',
      layers: [
        {
          tag: 'Paso 1',
          title: 'Commit',
          text: 'Análisis estático y comprobaciones rápidas antes de integrar.',
        },
        {
          tag: 'Paso 2',
          title: 'Build y pruebas rápidas',
          text: 'Compilación y pruebas unitarias con resultado inmediato.',
        },
        {
          tag: 'Paso 3',
          title: 'Integración y contratos',
          text: 'Pruebas de API y contratos contra entornos controlados.',
        },
        {
          tag: 'Paso 4',
          title: 'Despliegue progresivo',
          text: 'Liberación gradual con posibilidad de revertir.',
        },
        {
          tag: 'Paso 5',
          title: 'Verificación en producción',
          text: 'Comprobaciones tras el despliegue y señales de alerta.',
        },
      ],
      outcomesTitle: 'Qué te llevas',
      outcomes: [
        'Pipeline con quality gates definidos',
        'Criterios de promoción entre entornos',
        'Estrategia de despliegue y reversión',
        'Verificación posterior al despliegue',
      ],
    },
  ],
  process: {
    eyebrow: 'Cómo trabajamos',
    title: 'Un proceso claro, de la primera charla al traspaso',
    subtitle: 'Cada proyecto se adapta a tu contexto, pero sigue estas cuatro etapas.',
    steps: [
      { title: 'Conversación', text: 'Conocemos tu producto, tu equipo y qué quieres conseguir.' },
      { title: 'Diagnóstico', text: 'Analizamos el punto de partida y los riesgos principales.' },
      { title: 'Propuesta', text: 'Te presentamos alcance, fases y entregables antes de empezar.' },
      { title: 'Entrega y traspaso', text: 'Implementamos y dejamos al equipo autónomo con documentación.' },
    ],
  },
  cta: {
    title: '¿Tienes un reto de calidad en mente?',
    text: 'Cuéntanos tu situación y te explicamos qué servicio encaja mejor.',
    button: 'Contactar',
    secondary: 'Ver qué incluye ASE',
  },
}

export const consultingPageEn: ConsultingCopy = {
  meta: {
    title: 'QA consulting and test automation framework services',
    description:
      'QA strategy, quality architecture, test automation frameworks and CI/CD quality gates. Explore each service layer by layer and tell us about your project.',
  },
  hero: {
    eyebrow: 'Services',
    title: 'Software quality, layer by layer',
    subtitle:
      'QA consulting and frameworks: from strategy to automation inside your pipeline. Open up each service and see what is inside.',
    cta: "Let's talk about your project",
    ctaSecondary: "See what's included in ASE",
    stackLabel: 'The four services stacked as layers of a single quality practice',
    hint: 'Hover or focus a layer to highlight it',
  },
  scrollHint: 'Scroll to open the service',
  services: [
    {
      id: 'estrategia',
      accent: 'sky',
      short: 'QA strategy',
      eyebrow: '01 · Strategy',
      title: 'Quality strategy and audit',
      summary:
        'We start from how you work today to decide what to test, in what order, and how to measure improvement. No generic templates.',
      layers: [
        {
          tag: 'Understand',
          title: 'Assessment',
          text: 'We review processes, existing tests, incidents and product context.',
        },
        {
          tag: 'Prioritise',
          title: 'Risks',
          text: 'We rank what to test by impact and likelihood of failure.',
        },
        {
          tag: 'Define',
          title: 'Test strategy',
          text: 'Test levels, responsibilities, environments and exit criteria.',
        },
        {
          tag: 'Plan',
          title: 'Roadmap',
          text: 'A phased plan with metrics to track progress.',
        },
      ],
      outcomesTitle: 'What you get',
      outcomes: [
        'Risk and coverage map',
        'Documented test strategy',
        'Phased, prioritised roadmap',
        'Agreed quality metrics',
      ],
    },
    {
      id: 'arquitectura',
      accent: 'emerald',
      short: 'Quality architecture',
      eyebrow: '02 · Architecture',
      title: 'Quality architecture',
      summary:
        'We design how testing fits into your system: what is tested at each level, with which tools and which data.',
      layers: [
        {
          tag: 'Levels',
          title: 'Test pyramid',
          text: 'What each level covers: unit, API, UI and end-to-end.',
        },
        {
          tag: 'Integration',
          title: 'Contracts and integration',
          text: 'Contract tests between services to catch changes that break consumers.',
        },
        {
          tag: 'Support',
          title: 'Data and environments',
          text: 'Controlled test data and reproducible environments.',
        },
        {
          tag: 'Visibility',
          title: 'Observability',
          text: 'Metrics, traces and logs that link test failures to causes.',
        },
      ],
      outcomesTitle: 'What you get',
      outcomes: [
        'Test architecture by level',
        'Justified tool selection',
        'Test data and environment model',
        'Quality criteria per component',
      ],
    },
    {
      id: 'frameworks',
      accent: 'amber',
      short: 'Frameworks',
      eyebrow: '03 · Frameworks',
      title: 'Test automation frameworks',
      summary:
        'We build a maintainable framework for API, UI or mobile, with a clear structure your team can grow.',
      layers: [
        {
          tag: 'Layer 1',
          title: 'Test cases',
          text: 'Readable, independent scenarios that are easy to maintain.',
        },
        {
          tag: 'Layer 2',
          title: 'Clients and page objects',
          text: 'Reusable actions that isolate application changes.',
        },
        {
          tag: 'Layer 3',
          title: 'Framework core',
          text: 'Configuration, data handling, waits and shared utilities.',
        },
        {
          tag: 'Layer 4',
          title: 'Reporting',
          text: 'Clear results with evidence to debug quickly.',
        },
        {
          tag: 'Layer 5',
          title: 'CI execution',
          text: 'Repeatable, parallelisable runs in your pipeline.',
        },
      ],
      outcomesTitle: 'What you get',
      outcomes: [
        'Structured, documented repository',
        'Best-practice guide for the team',
        'First automated example cases',
        'Handover and team support',
      ],
    },
    {
      id: 'cicd',
      accent: 'violet',
      short: 'CI/CD and gates',
      eyebrow: '04 · CI/CD',
      title: 'CI/CD and quality gates',
      summary:
        'We bring quality into the pipeline: automatic checks at every step so what reaches production meets what was agreed.',
      layers: [
        {
          tag: 'Step 1',
          title: 'Commit',
          text: 'Static analysis and fast checks before merging.',
        },
        {
          tag: 'Step 2',
          title: 'Build and fast tests',
          text: 'Compilation and unit tests with immediate feedback.',
        },
        {
          tag: 'Step 3',
          title: 'Integration and contracts',
          text: 'API and contract tests against controlled environments.',
        },
        {
          tag: 'Step 4',
          title: 'Progressive delivery',
          text: 'Gradual rollout with the ability to roll back.',
        },
        {
          tag: 'Step 5',
          title: 'Production verification',
          text: 'Post-deployment checks and warning signals.',
        },
      ],
      outcomesTitle: 'What you get',
      outcomes: [
        'Pipeline with defined quality gates',
        'Promotion criteria between environments',
        'Deployment and rollback strategy',
        'Post-deployment verification',
      ],
    },
  ],
  process: {
    eyebrow: 'How we work',
    title: 'A clear process, from first call to handover',
    subtitle: 'Every project adapts to your context but follows these four stages.',
    steps: [
      { title: 'Conversation', text: 'We learn about your product, your team and what you want to achieve.' },
      { title: 'Assessment', text: 'We analyse the starting point and the main risks.' },
      { title: 'Proposal', text: 'We present scope, phases and deliverables before starting.' },
      { title: 'Delivery and handover', text: 'We implement and leave the team self-sufficient, with documentation.' },
    ],
  },
  cta: {
    title: 'Have a quality challenge in mind?',
    text: "Tell us your situation and we'll explain which service fits best.",
    button: 'Get in touch',
    secondary: "See what's included in ASE",
  },
}
