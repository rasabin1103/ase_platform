/**
 * Public /services page copy (EN + ES). Merged into `translations.ts` as `servicesPage`.
 */

import { servicesPageCatalogEsByCode } from './servicesPage.catalog.es'
import { servicesPageCatalogEnByCode } from './servicesPage.catalog.en'

export const servicesPageEn = {
  hero: {
    badge: 'What ASE includes',
    title: 'A complete ecosystem for professionals and teams who take quality seriously.',
    subtitle:
      'From hands-on training to ready-to-use tools and senior consulting — everything curated, integrated and accessible with your ASE plan.',
    primaryCta: 'Talk to us',
    secondaryCta: 'Platform overview',
    stats: {
      delivery: { label: 'TRAINING', value: 'Practical courses and labs with real experts' },
      model: { label: 'RESOURCES', value: 'Templates, frameworks and ready-to-use tools' },
      stack: { label: 'CONSULTING', value: 'Access to senior services included in Enterprise plans' },
    },
  },
  inside: {
    title: 'What you find inside ASE',
    cards: {
      c1: {
        icon: '◇',
        title: 'Courses and books',
        description:
          'A catalog of courses and technical books — books ship in PDF, EPUB, Kindle and audiobook, with a free preview before you buy.',
      },
      c2: {
        icon: '◆',
        title: 'Templates and frameworks',
        description:
          'Documentation, QA strategies, checklists and reporting models ready to use in your project.',
      },
      c3: {
        icon: '▣',
        title: 'Scripts and resources',
        description:
          'Downloadable scripts and configs with a built-in syntax-highlighted code viewer, hosted on GitHub and unlocked by your purchase.',
      },
      c4: {
        icon: '⬡',
        title: 'Consulting and services',
        description: 'Direct access to senior QA consulting for companies on the Enterprise plan.',
      },
      c5: {
        icon: '✦',
        title: 'Blog and community',
        description:
          'Articles with comments, likes/dislikes and one-click sharing to LinkedIn, X, Facebook and WhatsApp.',
      },
      c6: {
        icon: '★',
        title: 'Reviews and loyalty',
        description:
          'Star reviews on every product, plus a loyalty program that rewards tenure with Silver, Gold, Platinum and Infinite tiers.',
      },
    },
  },
  visuals: {
    pillMultiTenant: 'Multi-tenant',
    pillCiCd: 'CI/CD',
    pillObservability: 'Observability',
    architectureTitle: 'Architecture',
    architectureBody: 'Bounded contexts · contracts · rollout waves',
    qualityTitle: 'Quality gates',
    qualityBody: 'Automation signals wired into release trains',
    deliveryMapTitle: 'Live delivery map',
    phases: ['Design', 'Build', 'Verify', 'Operate'],
    showcaseSignals: 'Signals',
    showcaseLiveArchitecture: 'Live architecture',
    showcaseChips: ['APIs', 'RBAC', 'CI', 'Observability', 'Tenants', 'Audit'],
    showcaseFootnote: 'Modular delivery · tenant boundaries · automation-first quality gates',
    capabilityCoreSymbol: '◉',
    booksSpineMore: '•••',
  },
  overview: {
    badge: 'Overview',
    title: 'Capability map',
    subtitle: 'Six practice areas — one engineering philosophy.',
    categoryLabels: {
      platform_engineering: 'Platform engineering',
      qa_automation: 'QA automation',
      training: 'Training',
      digital_products: 'Digital products',
      consulting: 'Consulting',
      ai_automation: 'AI & automation',
      frameworks: 'Frameworks',
    },
  },
  showcase: {
    featuresTitle: 'What you get',
    highlightsTitle: 'Highlights',
    ctaTalk: 'Talk to us',
    ctaPlatform: 'Platform overview',
    featuredLabel: 'Featured',
  },
  capabilities: {
    badge: 'Ecosystem',
    title: 'Capabilities map',
    subtitle:
      'A connected ecosystem of platforms, automation, frameworks and tools — designed to operate as one unified architecture.',
    coreTitle: 'ASE Platform Core',
    coreSubtitle: 'Control plane · policies · observability',
    panelHint: 'Hover a module to trace connections across the ecosystem.',
    panelDefaultTitle: 'ASE',
    items: {
      saas: {
        title: 'SaaS Platforms',
        description:
          'Multi-tenant architectures, organizations, users, subscriptions and governance — the backbone for scalable products.',
        highlights: ['Tenant boundaries', 'Lifecycle ops', 'Service boundaries'],
      },
      qa: {
        title: 'QA Automation',
        description:
          'API/UI automation ecosystems with reporting, CI/CD integration and a clear quality strategy.',
        highlights: ['Signal-rich pipelines', 'Flake control', 'Release confidence'],
      },
      rbac: {
        title: 'RBAC & Security',
        description: 'Roles, permissions, access control and enterprise governance aligned to how teams really work.',
        highlights: ['Least privilege', 'Policy-ready', 'Audit-friendly'],
      },
      billing: {
        title: 'Billing & Subscriptions',
        description: 'Plans, monetization, entitlements and recurring billing primitives for SaaS economics.',
        highlights: ['Entitlements', 'Usage-ready', 'Revenue clarity'],
      },
      training: {
        title: 'Technical Training',
        description: 'Enterprise workshops, mentoring and enablement programs that transfer durable skills.',
        highlights: ['Hands-on labs', 'Team ramps', 'Playbooks'],
      },
      frameworks: {
        title: 'Framework Ecosystem',
        description: 'Reusable automation frameworks and accelerators for Karate, Playwright, WDIO and Pytest.',
        highlights: ['Templates', 'CI defaults', 'Shared patterns'],
      },
      books: {
        title: 'Books & Digital Assets',
        description: 'Premium technical library with guides, books and reusable assets for practitioners.',
        highlights: ['Dense references', 'Checklists', 'Reusable packs'],
      },
      ai: {
        title: 'AI Automation',
        description: 'Operational workflows assisted by AI and automation pipelines with guardrails and ownership.',
        highlights: ['Human-in-the-loop', 'Integrations', 'Throughput'],
      },
      dashboards: {
        title: 'Enterprise Dashboards',
        description: 'Administrative UX and operational visibility for operators running complex platforms.',
        highlights: ['Clarity', 'Role-aware UX', 'Operational signals'],
      },
      audit: {
        title: 'Audit & Governance',
        description: 'Audit logs, traceability and operational monitoring for accountable delivery.',
        highlights: ['Traceability', 'Evidence trails', 'Controls'],
      },
    },
  },
  frameworks: {
    badge: 'Frameworks',
    title: 'Framework ecosystem',
    subtitle: 'Accelerators wired for CI/CD, parallel runs and enterprise governance.',
    ribbon: 'Test pipelines · CI gates · reporting',
    items: {
      karate: 'Karate',
      playwright: 'Playwright',
      pytest: 'Pytest',
      wdio: 'WDIO',
      apiTesting: 'API testing',
      reporting: 'Reporting',
    },
    pills: {
      repositories: 'Repositories',
      parallelRuns: 'Parallel runs',
      artifacts: 'Artifacts',
      flakeTriage: 'Flake triage',
    },
  },
  books: {
    badge: 'Digital assets',
    title: 'Books & digital assets',
    subtitle: 'Dense references for builders — not slide decks.',
    cover: {
      brandLeft: 'ASE Press',
      brandRight: 'Digital',
      titleFallback: 'Technical library',
      bodyFallback:
        'Placeholder visual — premium PDFs, workbooks and structured chapters for practitioners.',
    },
    spine: {
      guides: 'Guides',
      pdfs: 'PDFs',
      templates: 'Templates',
      checklists: 'Checklists',
      labs: 'Labs',
      bundles: 'Bundles',
    },
    labels: {
      pdf: 'PDF',
      workbook: 'Workbook',
    },
    moduleTitle: 'Premium module',
    moduleBody: 'Structured exercises, checklists and references — designed like internal playbooks.',
    items: {
      python: { tag: 'Python' },
      sql: { tag: 'SQL' },
      qa: { tag: 'QA' },
      automation: { tag: 'Automation' },
      guides: { tag: 'Guides' },
      templates: { tag: 'Templates' },
    },
  },
  training: {
    badge: 'Training',
    title: 'Training & enablement',
    subtitle: 'Workshops, onboarding ramps and coaching that survives the sprint.',
    items: {
      workshops: 'Workshops',
      mentoring: 'Mentoring',
      enterprise: 'Enterprise programs',
      labs: 'Labs',
    },
    stepBodies: [
      'Align constraints, stakeholders and measurable outcomes before writing code.',
      'Hands-on sessions with realistic exercises tied to your stack and delivery model.',
      'Embed coaches and playbooks so practices survive day-to-day delivery pressure.',
      'Harden playbooks, ownership and continuous improvement loops across teams.',
    ],
  },
  cta: {
    badge: 'Next step',
    title: 'Ready to align architecture, quality and speed?',
    subtitle: 'We’ll help you scope the right next step — from audit to delivery.',
    primary: 'Talk to us',
    secondary: 'Platform overview',
  },
  states: {
    loading: 'Loading services…',
    error: 'We could not load services. Check your connection and try again.',
    empty: 'No services are available right now.',
    retry: 'Retry',
  },
  catalog: {
    byCode: servicesPageCatalogEnByCode,
  },
} as const

export const servicesPageEs = {
  hero: {
    badge: 'Qué incluye ASE',
    title: 'Un ecosistema completo para profesionales y equipos que se toman en serio la calidad.',
    subtitle:
      'Desde formación práctica hasta herramientas listas para usar y consultoría senior — todo curado, todo integrado, todo accesible con tu plan ASE.',
    primaryCta: 'Hablemos',
    secondaryCta: 'Overview de plataforma',
    stats: {
      delivery: { label: 'FORMACIÓN', value: 'Cursos y laboratorios prácticos con expertos reales' },
      model: { label: 'RECURSOS', value: 'Plantillas, frameworks y herramientas listas para usar' },
      stack: { label: 'CONSULTORÍA', value: 'Acceso a servicios senior incluidos en planes Enterprise' },
    },
  },
  inside: {
    title: 'Lo que encuentras dentro de ASE',
    cards: {
      c1: {
        icon: '◇',
        title: 'Cursos y libros',
        description:
          'Catálogo de cursos y libros técnicos — los libros se entregan en PDF, EPUB, Kindle y audiolibro, con vista previa gratuita antes de comprar.',
      },
      c2: {
        icon: '◆',
        title: 'Plantillas y frameworks',
        description:
          'Documentación, estrategias QA, checklists y modelos de reporting listos para usar en tu proyecto.',
      },
      c3: {
        icon: '▣',
        title: 'Scripts y recursos',
        description:
          'Scripts y configuraciones descargables con visor de código con sintaxis resaltada, alojados en GitHub y desbloqueados al comprar.',
      },
      c4: {
        icon: '⬡',
        title: 'Consultoría y servicios',
        description: 'Acceso directo a consultoría QA senior para empresas con plan Enterprise.',
      },
      c5: {
        icon: '✦',
        title: 'Blog y comunidad',
        description:
          'Artículos con comentarios, me gusta/no me gusta y un clic para compartir en LinkedIn, X, Facebook y WhatsApp.',
      },
      c6: {
        icon: '★',
        title: 'Reseñas y fidelidad',
        description:
          'Valoraciones con estrellas en cada producto, más un programa de fidelidad que premia la antigüedad con niveles Plata, Oro, Platino e Infinita.',
      },
    },
  },
  visuals: {
    pillMultiTenant: 'Multi-tenant',
    pillCiCd: 'CI/CD',
    pillObservability: 'Observabilidad',
    architectureTitle: 'Arquitectura',
    architectureBody: 'Contextos delimitados · contratos · olas de despliegue',
    qualityTitle: 'Gates de calidad',
    qualityBody: 'Señales de automatización integradas en los trenes de release',
    deliveryMapTitle: 'Mapa de entrega en vivo',
    phases: ['Diseño', 'Construcción', 'Verificación', 'Operación'],
    showcaseSignals: 'Señales',
    showcaseLiveArchitecture: 'Arquitectura viva',
    showcaseChips: ['APIs', 'RBAC', 'CI', 'Observabilidad', 'Tenants', 'Auditoría'],
    showcaseFootnote: 'Entrega modular · límites de tenant · quality gates automation-first',
    capabilityCoreSymbol: '◉',
    booksSpineMore: '•••',
  },
  overview: {
    badge: 'Resumen',
    title: 'Mapa de capacidades',
    subtitle: 'Seis áreas de práctica — una filosofía de ingeniería.',
    categoryLabels: {
      platform_engineering: 'Ingeniería de plataforma',
      qa_automation: 'Automatización QA',
      training: 'Formación',
      digital_products: 'Productos digitales',
      consulting: 'Consultoría',
      ai_automation: 'IA y automatización',
      frameworks: 'Frameworks',
    },
  },
  showcase: {
    featuresTitle: 'Qué incluye',
    highlightsTitle: 'Destacados',
    ctaTalk: 'Hablemos',
    ctaPlatform: 'Overview de plataforma',
    featuredLabel: 'Destacado',
  },
  capabilities: {
    badge: 'Ecosistema',
    title: 'Mapa de capacidades',
    subtitle:
      'Un ecosistema conectado de plataformas, automatización, frameworks y herramientas diseñadas para operar como una arquitectura unificada.',
    coreTitle: 'Núcleo de plataforma ASE',
    coreSubtitle: 'Plano de control · políticas · observabilidad',
    panelHint: 'Pasa el cursor sobre un módulo para ver las conexiones del ecosistema.',
    panelDefaultTitle: 'ASE',
    items: {
      saas: {
        title: 'Plataformas SaaS',
        description:
          'Arquitecturas multi-tenant, organizaciones, usuarios, suscripciones y gobernanza: la base para productos escalables.',
        highlights: ['Límites de tenant', 'Ops de ciclo de vida', 'Fronteras de servicio'],
      },
      qa: {
        title: 'Automatización QA',
        description:
          'Ecosistemas de automatización API/UI con reporting, integración CI/CD y estrategia de calidad clara.',
        highlights: ['Pipelines con señal', 'Control de flakes', 'Confianza en release'],
      },
      rbac: {
        title: 'RBAC y seguridad',
        description: 'Roles, permisos, control de acceso y gobernanza enterprise alineada con cómo trabajan los equipos.',
        highlights: ['Mínimo privilegio', 'Listo para políticas', 'Auditable'],
      },
      billing: {
        title: 'Facturación y suscripciones',
        description: 'Planes, monetización, derechos de uso y billing recurrente para economía SaaS.',
        highlights: ['Derechos de uso', 'Preparado para uso medido', 'Claridad de ingresos'],
      },
      training: {
        title: 'Formación técnica',
        description: 'Workshops enterprise, mentoring y programas de enablement que dejan habilidades duraderas.',
        highlights: ['Labs prácticos', 'Rampas de equipo', 'Playbooks'],
      },
      frameworks: {
        title: 'Ecosistema de frameworks',
        description: 'Frameworks de automatización reutilizables y aceleradores para Karate, Playwright, WDIO y Pytest.',
        highlights: ['Plantillas', 'Defaults CI', 'Patrones compartidos'],
      },
      books: {
        title: 'Libros y activos digitales',
        description: 'Biblioteca técnica premium con guías, libros y assets reutilizables para practitioners.',
        highlights: ['Referencias densas', 'Checklists', 'Packs reutilizables'],
      },
      ai: {
        title: 'Automatización con IA',
        description: 'Workflows operativos asistidos por IA y pipelines de automatización con guardrails y ownership.',
        highlights: ['Con humano en el bucle', 'Integraciones', 'Rendimiento'],
      },
      dashboards: {
        title: 'Paneles enterprise',
        description: 'UX administrativa y visibilidad operativa para equipos que operan plataformas complejas.',
        highlights: ['Claridad', 'UX consciente de roles', 'Señales operativas'],
      },
      audit: {
        title: 'Auditoría y gobernanza',
        description: 'Logs de auditoría, trazabilidad y monitorización operativa para entrega responsable.',
        highlights: ['Trazabilidad', 'Evidencias', 'Controles'],
      },
    },
  },
  frameworks: {
    badge: 'Frameworks',
    title: 'Ecosistema de frameworks',
    subtitle: 'Aceleradores pensados para CI/CD, ejecución paralela y gobernanza enterprise.',
    ribbon: 'Pipelines de test · gates de CI · informes',
    items: {
      karate: 'Karate',
      playwright: 'Playwright',
      pytest: 'Pytest',
      wdio: 'WDIO',
      apiTesting: 'Pruebas API',
      reporting: 'Informes',
    },
    pills: {
      repositories: 'Repositorios',
      parallelRuns: 'Ejecución paralela',
      artifacts: 'Artefactos',
      flakeTriage: 'Triage de flakes',
    },
  },
  books: {
    badge: 'Activos digitales',
    title: 'Libros y activos digitales',
    subtitle: 'Referencias densas para builders — no decks de moda.',
    cover: {
      brandLeft: 'ASE Press',
      brandRight: 'Digital',
      titleFallback: 'Biblioteca técnica',
      bodyFallback:
        'Vista ilustrativa — PDFs premium, cuadernos prácticos y capítulos estructurados para practitioners.',
    },
    spine: {
      guides: 'Guías',
      pdfs: 'PDFs',
      templates: 'Plantillas',
      checklists: 'Checklists',
      labs: 'Labs',
      bundles: 'Bundles',
    },
    labels: {
      pdf: 'PDF',
      workbook: 'Cuaderno práctico',
    },
    moduleTitle: 'Módulo premium',
    moduleBody: 'Ejercicios estructurados, checklists y referencias — como playbooks internos.',
    items: {
      python: { tag: 'Python' },
      sql: { tag: 'SQL' },
      qa: { tag: 'QA' },
      automation: { tag: 'Automatización' },
      guides: { tag: 'Guías' },
      templates: { tag: 'Plantillas' },
    },
  },
  training: {
    badge: 'Formación',
    title: 'Formación y enablement',
    subtitle: 'Workshops, rampas de onboarding y coaching que sobreviven al sprint.',
    items: {
      workshops: 'Talleres',
      mentoring: 'Mentoría',
      enterprise: 'Programas enterprise',
      labs: 'Laboratorios',
    },
    stepBodies: [
      'Alinear restricciones, stakeholders y resultados medibles antes de escribir código.',
      'Sesiones prácticas con ejercicios realistas acoplados a tu stack y modelo de entrega.',
      'Incrustar coaches y playbooks para que las prácticas sobrevivan a la presión del día a día.',
      'Consolidar playbooks, ownership y bucles de mejora continua entre equipos.',
    ],
  },
  catalog: {
    byCode: servicesPageCatalogEsByCode,
  },
  cta: {
    badge: 'Siguiente paso',
    title: '¿Alineamos arquitectura, calidad y velocidad?',
    subtitle: 'Te ayudamos a acotar el siguiente paso — de auditoría a entrega.',
    primary: 'Hablemos',
    secondary: 'Overview de plataforma',
  },
  states: {
    loading: 'Cargando servicios…',
    error: 'No pudimos cargar los servicios. Revisa la conexión e inténtalo de nuevo.',
    empty: 'No hay servicios disponibles en este momento.',
    retry: 'Reintentar',
  },
} as const
