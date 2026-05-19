/**
 * Spanish overlay for API-backed public services (`code` matches seed catalog).
 * Used when UI language is `es` so pillar cards and bands are not stuck in English.
 */

export const servicesPageCatalogEsByCode = {
  saas_platform_engineering: {
    name: 'Ingeniería de plataformas SaaS',
    heroTitle: 'Ingeniería de plataformas SaaS',
    heroSubtitle: 'De cimientos a operación en producción.',
    shortDescription: 'Plataformas multi-tenant, RBAC, facturación y flujos enterprise.',
    description:
      'Diseño y entrega de plataformas SaaS listas para producción, con aislamiento de tenant, control de acceso por roles, facturación por suscripción, derechos de producto y operaciones auditables.',
    features: [
      'Arquitectura multi-tenant',
      'Sistemas RBAC',
      'Facturación y suscripciones',
      'Control de acceso a productos',
      'Registros de auditoría',
      'Flujos de trabajo enterprise',
    ],
    highlights: [
      {
        title: 'Alcance típico',
        value: 'MVP de plataforma → escala',
        description: 'Arquitectura, entrega y endurecimiento en releases iterativos.',
      },
      {
        title: 'Postura de stack',
        value: 'API-first · observable',
        description: 'Servicios pensados para CI/CD, métricas y claridad operativa.',
      },
    ],
  },
  qa_automation_architecture: {
    name: 'Arquitectura de automatización QA',
    heroTitle: 'Arquitectura de automatización QA',
    heroSubtitle: 'Señales fiables desde la automatización, no ruido.',
    shortDescription: 'Ecosistemas de automatización integrados en CI/CD con gobernanza.',
    description:
      'Arquitectura end-to-end de automatización QA: frameworks, pipelines, reporting y gobernanza de calidad alineada con cómo envían tus equipos.',
    features: [
      'Frameworks de automatización API',
      'Ecosistemas de automatización UI',
      'Integración CI/CD',
      'Observabilidad e informes',
      'Estrategia de pruebas',
      'Gobernanza de calidad',
    ],
    highlights: [
      {
        title: 'Profundidad de integración',
        value: 'Pipelines + dashboards',
        description: 'Automatización conectada a build, deploy y quality gates.',
      },
      {
        title: 'Modelo operativo',
        value: 'Velocidad gobernada',
        description: 'Gestión de flakes, ownership y confianza medible en el release.',
      },
    ],
  },
  business_process_automation: {
    name: 'Automatización de procesos de negocio',
    heroTitle: 'Automatización de procesos de negocio',
    heroSubtitle: 'Menos fricción manual. Más throughput.',
    shortDescription: 'Workflows internos, operaciones asistidas por IA y telar de integraciones.',
    description:
      'Automatización de flujos administrativos y operativos con asistencia pragmática de IA, documentos, notificaciones e integraciones en tu toolchain.',
    features: [
      'Workflows internos',
      'Operaciones asistidas por IA',
      'Automatización documental',
      'Automatización administrativa',
      'Notificaciones e integraciones',
      'Pipelines de automatización',
    ],
    highlights: [
      {
        title: 'Enfoque en resultados',
        value: 'Horas ahorradas / semana',
        description: 'Automatización acotada a palanca operativa medible.',
      },
      {
        title: 'Seguridad',
        value: 'Humano en el bucle',
        description: 'Controles para aprobaciones, auditoría y caminos de rollback.',
      },
    ],
  },
  technical_training: {
    name: 'Formación técnica',
    heroTitle: 'Formación técnica',
    heroSubtitle: 'Enablement que perdura después del taller.',
    shortDescription: 'Workshops, enablement y coaching técnico práctico.',
    description:
      'Programas de formación enterprise que cubren QA, Python, ingeniería de automatización y enablement de equipos — desde rampas de onboarding hasta talleres avanzados.',
    features: [
      'Formación QA',
      'Formación Python',
      'Cursos de automatización',
      'Workshops enterprise',
      'Enablement de equipos',
      'Labs prácticos',
    ],
    highlights: [
      {
        title: 'Formatos',
        value: 'Remoto / in situ',
        description: 'Cohortes, intensivos y coaching incrustado.',
      },
      {
        title: 'Profundidad',
        value: 'Principiante → avanzado',
        description: 'Progresiones alineadas a tu stack y restricciones de entrega.',
      },
    ],
  },
  premium_frameworks: {
    name: 'Frameworks premium',
    heroTitle: 'Frameworks premium',
    heroSubtitle: 'Aceleradores para enviar, no demos de estantería.',
    shortDescription: 'Aceleradores Karate, Playwright, Pytest y WDIO para equipos enterprise.',
    description:
      'Frameworks de automatización curados y aceleradores reutilizables — estructurados para mantenibilidad, integración CI y gobernanza enterprise.',
    features: [
      'Framework Karate',
      'Framework Playwright',
      'Framework API Pytest',
      'Ecosistemas WDIO',
      'Plantillas enterprise',
      'Aceleradores reutilizables',
    ],
    highlights: [
      {
        title: 'Repositorios',
        value: 'Layouts con criterio',
        description: 'Patrones para escalar suites entre equipos y servicios.',
      },
      {
        title: 'Postura CI',
        value: 'Paralelo · particionado',
        description: 'Defaults para feedback rápido y pipelines estables.',
      },
    ],
  },
  technical_books_digital_assets: {
    name: 'Libros técnicos y activos digitales',
    heroTitle: 'Libros técnicos y activos digitales',
    heroSubtitle: 'Referencias densas y prácticas — como playbooks internos.',
    shortDescription: 'Libros, guías, PDFs y activos técnicos premium.',
    description:
      'Libros técnicos premium y activos digitales sobre Python, SQL, QA y automatización — pensados para quienes construyen sistemas reales.',
    features: [
      'Libros Python',
      'Libros SQL',
      'Libros QA',
      'Guías de automatización',
      'PDFs premium',
      'Activos técnicos',
    ],
    highlights: [
      {
        title: 'Formatos',
        value: 'PDF · bundles',
        description: 'Capítulos estructurados, checklists y ejemplos resueltos.',
      },
      {
        title: 'Audiencia',
        value: 'Builders',
        description: 'Escrito para ingenieros, leads y operadores — no decks de moda.',
      },
    ],
  },
} as const
