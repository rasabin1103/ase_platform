/**
 * Public `/about` page copy (EN + ES). Merged into `translations.ts` as `aboutPage`.
 *
 * Rule: no visible hardcoded strings in About page UI — everything comes from these keys.
 */

export const aboutPageEn = {
  hero: {
    badge: 'Engineering Philosophy',
    title: 'Software engineering built to last',
    subtitle:
      'Arce Sabin Engineering is built on a simple idea: modern companies don’t need more tools. They need solid systems, real automation, and platforms that can grow without losing control.',
    cards: {
      architecture: {
        icon: '◇',
        title: 'Architecture',
        description: 'Boundaries, contracts and scalability — designed before code.',
      },
      automation: {
        icon: '◆',
        title: 'Automation',
        description: 'Quality and operations pipelines that reduce manual friction.',
      },
      quality: {
        icon: '▣',
        title: 'Quality',
        description: 'Predictable delivery with governance, signals and observability.',
      },
      scale: {
        icon: '⬡',
        title: 'Scalability',
        description: 'Multi-tenant foundations and operator-first workflows.',
      },
    },
  },
  why: {
    badge: 'Origin',
    title: 'Why ASE exists',
    body:
      'After years in enterprise projects, we kept seeing the same pattern: fragile systems, automation that’s hard to maintain, accumulated technical debt, and manual processes that constrained growth.\n\nASE exists to solve that problem.\n\nNot as a traditional consultancy — but as an engineering studio focused on building robust platforms, sustainable automation, and software designed to evolve for years.',
    timeline: {
      title: 'Engineering signals',
      items: [
        { title: 'Fragility', desc: 'Systems that break under change and lack clear boundaries.' },
        { title: 'Automation debt', desc: 'Flaky pipelines, unclear ownership, and maintenance drag.' },
        { title: 'Manual ops', desc: 'Unmeasured workflows that silently tax teams.' },
        { title: 'Governance gap', desc: 'RBAC, tenant boundaries and auditability added too late.' },
      ],
    },
  },
  principles: {
    badge: 'Mission · Vision · Philosophy',
    cards: {
      mission: {
        icon: '◇',
        title: 'Mission',
        body: 'Design platforms and automation ecosystems that let companies operate with speed, quality and control.',
      },
      vision: {
        icon: '◆',
        title: 'Vision',
        body: 'Become a European reference in platform engineering, intelligent automation and enterprise SaaS architecture.',
      },
      philosophy: {
        icon: '▣',
        title: 'Philosophy',
        bullets: [
          'Architecture over improvisation',
          'Automation over repetition',
          'Clarity over complexity',
          'Maintainable systems over quick fixes',
          'Quality as part of engineering',
        ],
      },
    },
  },
  build: {
    badge: 'How we build',
    title: 'How we build',
    subtitle: 'A delivery approach designed for long-term operability — not short-term velocity hacks.',
    items: {
      architecture: {
        icon: '◇',
        title: 'Solid architecture',
        body: 'We design scalability, maintainability and observability from day one.',
      },
      automation: {
        icon: '◆',
        title: 'Real automation',
        body: 'We reduce manual operations with testing, workflows and measurable processes.',
      },
      product: {
        icon: '▣',
        title: 'Product over project',
        body: 'We build platforms that can evolve for years — not one-off deliveries.',
      },
      ux: {
        icon: '⬡',
        title: 'Premium experience',
        body: 'Fast, clear interfaces designed for real operators and real states.',
      },
    },
  },
  differentiators: {
    badge: 'Differentiators',
    title: 'What sets ASE apart',
    items: [
      'Enterprise engineering mindset',
      'Deep QA automation specialization',
      'Modern SaaS architecture',
      'Multi-tenant platform foundations',
      'AI integration with guardrails',
      'Scalable systems and operational clarity',
      'Standards-based technical culture',
    ],
  },
  history: {
    badge: 'Timeline',
    title: 'A short timeline',
    items: [
      { year: '2024', body: 'ASE begins as an independent engineering initiative.' },
      { year: '2025', body: 'Enterprise frameworks and automation systems mature.' },
      { year: '2026', body: 'The modular ASE SaaS platform is built.' },
      { year: 'Future', body: 'A full ecosystem of automation, training and enterprise tooling.' },
    ],
  },
  closing: {
    title: 'ASE doesn’t aim to build disposable software.',
    body:
      'We build platforms companies can still rely on in 5 or 10 years.\n\nBecause real engineering isn’t only about shipping fast.\n\nIt’s about building correctly.',
    ctas: {
      platform: 'Explore platform',
      talk: 'Talk to ASE',
    },
  },
} as const

export const aboutPageEs = {
  hero: {
    badge: 'Filosofía de ingeniería',
    title: 'Ingeniería de software construida para durar',
    subtitle:
      'Arce Sabin Engineering nace de una idea simple: las empresas modernas no necesitan más herramientas. Necesitan sistemas sólidos, automatización real y plataformas capaces de crecer sin perder control.',
    cards: {
      architecture: {
        icon: '◇',
        title: 'Arquitectura',
        description: 'Fronteras, contratos y escalabilidad — diseñados antes del código.',
      },
      automation: {
        icon: '◆',
        title: 'Automatización',
        description: 'Pipelines de calidad y operaciones que eliminan fricción manual.',
      },
      quality: {
        icon: '▣',
        title: 'Calidad',
        description: 'Entrega predecible con gobernanza, señales y observabilidad.',
      },
      scale: {
        icon: '⬡',
        title: 'Escalabilidad',
        description: 'Fundamentos multi-tenant y workflows pensados para operadores.',
      },
    },
  },
  why: {
    badge: 'Origen',
    title: '¿Por qué existe ASE?',
    body:
      'Después de años trabajando en proyectos enterprise, detectamos el mismo patrón repetirse constantemente: sistemas frágiles, automatizaciones difíciles de mantener, deuda técnica acumulada y procesos manuales que limitaban el crecimiento.\n\nASE nace para resolver ese problema.\n\nNo como una consultora tradicional, sino como un estudio de ingeniería enfocado en construir plataformas robustas, automatización sostenible y software preparado para evolucionar durante años.',
    timeline: {
      title: 'Señales de ingeniería',
      items: [
        { title: 'Fragilidad', desc: 'Sistemas que se rompen con el cambio y carecen de fronteras claras.' },
        { title: 'Deuda de automatización', desc: 'Pipelines inestables, ownership difuso y mantenimiento costoso.' },
        { title: 'Operación manual', desc: 'Workflows sin medir que penalizan silenciosamente al equipo.' },
        { title: 'Brecha de gobernanza', desc: 'RBAC, fronteras de tenant y auditoría añadidos demasiado tarde.' },
      ],
    },
  },
  principles: {
    badge: 'Misión · Visión · Filosofía',
    cards: {
      mission: {
        icon: '◇',
        title: 'Misión',
        body: 'Diseñar plataformas y ecosistemas de automatización que permitan operar con velocidad, calidad y control.',
      },
      vision: {
        icon: '◆',
        title: 'Visión',
        body: 'Convertirnos en un referente europeo en ingeniería de plataformas, automatización inteligente y arquitectura SaaS empresarial.',
      },
      philosophy: {
        icon: '▣',
        title: 'Filosofía',
        bullets: [
          'Arquitectura antes que improvisación',
          'Automatización antes que repetición',
          'Claridad antes que complejidad',
          'Sistemas mantenibles antes que soluciones rápidas',
          'Calidad como parte de la ingeniería',
        ],
      },
    },
  },
  build: {
    badge: 'Cómo construimos',
    title: 'Cómo construimos',
    subtitle: 'Una forma de entregar pensada para operar a largo plazo — no para hacks de velocidad.',
    items: {
      architecture: {
        icon: '◇',
        title: 'Arquitectura sólida',
        body: 'Pensamos en escalabilidad, mantenibilidad y observabilidad desde el inicio.',
      },
      automation: {
        icon: '◆',
        title: 'Automatización real',
        body: 'Reducimos operaciones manuales con testing, workflows y procesos medibles.',
      },
      product: {
        icon: '▣',
        title: 'Producto antes que proyecto',
        body: 'Construimos plataformas preparadas para evolucionar durante años.',
      },
      ux: {
        icon: '⬡',
        title: 'Experiencia premium',
        body: 'Interfaces rápidas, claras y diseñadas para operaciones reales.',
      },
    },
  },
  differentiators: {
    badge: 'Diferenciales',
    title: 'Lo que diferencia a ASE',
    items: [
      'Mentalidad de ingeniería enterprise',
      'Especialización profunda en automatización QA',
      'Arquitectura SaaS moderna',
      'Fundamentos de plataforma multi-tenant',
      'Integración de IA con guardrails',
      'Sistemas escalables y claridad operativa',
      'Cultura técnica basada en estándares reales',
    ],
  },
  history: {
    badge: 'Timeline',
    title: 'Un timeline breve',
    items: [
      { year: '2024', body: 'Nace ASE como iniciativa de ingeniería independiente.' },
      { year: '2025', body: 'Desarrollo de frameworks y automatización enterprise.' },
      { year: '2026', body: 'Construcción de la plataforma SaaS modular ASE.' },
      { year: 'Futuro', body: 'Ecosistema completo de automatización, formación y herramientas empresariales.' },
    ],
  },
  closing: {
    title: 'ASE no busca construir software desechable.',
    body:
      'Construimos plataformas que las empresas puedan seguir utilizando dentro de 5 o 10 años.\n\nPorque la verdadera ingeniería no consiste solo en entregar rápido.\n\nConsiste en construir correctamente.',
    ctas: {
      platform: 'Explorar plataforma',
      talk: 'Hablar con ASE',
    },
  },
} as const

