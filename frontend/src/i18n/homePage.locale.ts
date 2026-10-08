/**
 * Copy de la página de inicio pública (EN + ES). Se fusiona en `translations.ts`
 * como clave raíz `homePage`. Sin textos sueltos en los componentes de
 * `components/public/home/`: todo sale de aquí.
 */

export const homePageEs = {
  hero: {
    eyebrow: 'Arce Sabín Engineering · Calidad de software',
    titleBefore: 'Todo lo que necesitas para dominar la',
    titleHighlight: 'calidad del software',
    titleAfter: '.',
    subtitle:
      'Formación que se juega, un catálogo técnico completo, empleo con análisis de encaje por IA y consultoría QA senior. Una sola plataforma, para profesionales, equipos y empresas.',
    primaryCta: 'Ver planes',
    secondaryCta: 'Probar ASE Academy',
    loginCta: 'Acceso clientes',
    micro: ['Sin permanencia', 'Acceso inmediato', 'Primera misión gratis'],
    visual: {
      catalogType: 'Libro',
      catalogTitle: 'Python para QA',
      catalogFormats: 'PDF · EPUB · Kindle · Audio',
      academyTag: 'ASE Academy',
      academyTitle: 'Misión 3 · Dentro del código',
      academyStatements: 'Sentencias',
      academyBranches: 'Ramas',
      jobsTag: 'Bolsa de empleo',
      jobsTitle: 'Encaje con la oferta',
      jobsLevel: 'Alto',
      loyaltyTag: 'Fidelidad',
      loyaltyLevel: 'Nivel Oro',
      example: 'Ejemplo ilustrativo',
    },
  },
  stats: {
    years: { value: 10, suffix: '+', label: 'años liderando QA en banca, aeronáutica y retail' },
    projects: { value: 120, suffix: '+', label: 'proyectos de calidad y automatización entregados' },
    missions: { suffix: '', label: 'misiones jugables en ASE Academy' },
    formats: { value: 4, suffix: '', label: 'formatos por libro: PDF, EPUB, Kindle y audio' },
    catalog: { label: 'títulos en el catálogo' },
    jobs: { label: 'ofertas de empleo activas' },
    articles: { label: 'artículos en el blog' },
    liveHint: 'Dato en directo',
  },
  ecosystem: {
    eyebrow: 'El ecosistema',
    title: 'Todo lo que incluye ASE, en una sola suscripción',
    subtitle:
      'No es un curso suelto ni una tienda de plantillas: es todo lo que un profesional o un equipo de calidad necesita, conectado.',
    tiles: {
      catalog: {
        title: 'Catálogo técnico',
        desc: 'Cursos, libros, scripts, frameworks y plantillas listos para usar, con vista previa gratuita y reseñas reales.',
        chips: ['Cursos', 'Libros', 'Scripts', 'Plantillas'],
        cta: 'Explorar el catálogo',
      },
      academy: {
        title: 'ASE Academy',
        desc: 'Cursos-juego en los que trabajas en una empresa ficticia, tomas decisiones con presión real y ves sus consecuencias.',
        cta: 'Jugar gratis',
      },
      jobs: {
        title: 'Empleo con análisis de encaje',
        desc: 'Ofertas de tecnología y QA, y un análisis con IA de cuánto encaja tu CV, tus brechas y cómo preparar la entrevista.',
      },
      consulting: {
        title: 'Consultoría QA senior',
        desc: 'Estrategia de calidad, arquitectura de automatización y plataformas, con más de 10 años en entornos críticos.',
      },
      community: {
        title: 'Comunidad y blog',
        desc: 'Artículos de ingeniería de calidad con comentarios, reacciones y compartidos.',
      },
      loyalty: {
        title: 'Programa de fidelidad',
        desc: 'Tu antigüedad cuenta: recompensas que crecen nivel a nivel.',
        levels: ['Plata', 'Oro', 'Platino', 'Infinita'],
      },
      teams: {
        title: 'Organizaciones y equipos',
        desc: 'Varios miembros, roles y permisos, registro de auditoría y facturación propia.',
      },
      frameworks: {
        title: 'Frameworks de automatización',
        desc: 'Aceleradores listos para CI/CD y ejecución en paralelo.',
      },
    },
  },
  academy: {
    eyebrow: 'ASE Academy',
    title: 'No vas a ver vídeos. Vas a trabajar.',
    subtitle:
      'Cada misión es una jornada real: reuniones, prisas, compañeros con sus propias ideas y decisiones con consecuencias. Lo que no pruebes se convierte en un bug que verás nacer.',
    dayTitle: 'Así es un día',
    day: [
      { time: '09:15', text: 'El senior jura que tiene «100 % de cobertura». Hay un bug en producción.' },
      { time: '11:30', text: 'La PO quiere «solo el caso feliz, que vamos justos».' },
      { time: '13:00', text: 'Go / no-go. La checklist está en verde… ¿y tú qué recomiendas?' },
      { time: '17:00', text: 'Debrief: qué evitaste, qué se escapó y qué habría hecho un QA senior.' },
    ],
    missions: 'misiones jugables',
    level: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', expert: 'Experto' },
    hours: 'h',
    cta: 'Jugar la primera misión gratis',
    courseCta: 'Ver curso',
  },
  catalog: {
    eyebrow: 'Catálogo',
    title: 'Lo más valorado del catálogo',
    subtitle: 'Recursos técnicos con vista previa, reseñas y descarga inmediata.',
    free: 'Gratis',
    cta: 'Ver todo el catálogo',
    reviews: 'reseñas',
    prev: 'Anteriores',
    next: 'Siguientes',
  },
  audiences: {
    eyebrow: 'Para quién',
    title: 'Crece contigo: de profesional a organización',
    items: {
      pro: {
        title: 'Profesionales',
        bullets: [
          'Todo el catálogo según tu plan',
          'Cursos-juego y preparación ISTQB®',
          'Análisis de encaje con ofertas de empleo',
        ],
        cta: 'Ver planes',
      },
      teams: {
        title: 'Equipos',
        bullets: [
          'Frameworks y plantillas para entregar con calidad',
          'Formación práctica para todo el equipo',
          'Recursos compartidos y actualizados',
        ],
        cta: 'Ver planes',
      },
      enterprise: {
        title: 'Empresas',
        bullets: [
          'Organización con roles, permisos y auditoría',
          'Portal de facturación propio',
          'Consultoría QA senior incluida',
        ],
        cta: 'Hablar con ASE',
      },
    },
  },
  steps: {
    eyebrow: 'Cómo funciona',
    title: 'Empieza en minutos',
    items: [
      { title: 'Elige tu plan', text: 'Gratis para empezar; Pro, Business o Enterprise cuando lo necesites.' },
      { title: 'Accede a todo al momento', text: 'Catálogo, Academy, empleo y comunidad desde el primer día.' },
      { title: 'Crece con la plataforma', text: 'Tu antigüedad sube de nivel y desbloquea recompensas.' },
    ],
  },
  finalCta: {
    title: 'Tu próxima mejora de calidad empieza hoy.',
    subtitle: 'Prueba ASE Academy gratis o elige el plan que encaja contigo. Sin permanencia.',
    primary: 'Ver planes',
    secondary: 'Jugar gratis',
    tertiary: 'Hablar con ASE',
  },
}

export const homePageEn: typeof homePageEs = {
  hero: {
    eyebrow: 'Arce Sabín Engineering · Software quality',
    titleBefore: 'Everything you need to master',
    titleHighlight: 'software quality',
    titleAfter: '.',
    subtitle:
      'Training you play, a complete technical catalog, jobs with AI fit analysis and senior QA consulting. One platform for professionals, teams and companies.',
    primaryCta: 'See plans',
    secondaryCta: 'Try ASE Academy',
    loginCta: 'Client login',
    micro: ['No lock-in', 'Instant access', 'First mission free'],
    visual: {
      catalogType: 'Book',
      catalogTitle: 'Python for QA',
      catalogFormats: 'PDF · EPUB · Kindle · Audio',
      academyTag: 'ASE Academy',
      academyTitle: 'Mission 3 · Inside the code',
      academyStatements: 'Statements',
      academyBranches: 'Branches',
      jobsTag: 'Job board',
      jobsTitle: 'Fit with the job',
      jobsLevel: 'High',
      loyaltyTag: 'Loyalty',
      loyaltyLevel: 'Gold level',
      example: 'Illustrative example',
    },
  },
  stats: {
    years: { value: 10, suffix: '+', label: 'years leading QA in banking, aerospace and retail' },
    projects: { value: 120, suffix: '+', label: 'quality and automation projects delivered' },
    missions: { suffix: '', label: 'playable missions in ASE Academy' },
    formats: { value: 4, suffix: '', label: 'formats per book: PDF, EPUB, Kindle and audio' },
    catalog: { label: 'titles in the catalog' },
    jobs: { label: 'active job offers' },
    articles: { label: 'blog articles' },
    liveHint: 'Live figure',
  },
  ecosystem: {
    eyebrow: 'The ecosystem',
    title: 'Everything ASE includes, in one subscription',
    subtitle:
      "It isn't a single course or a template shop: it's everything a quality professional or team needs, connected.",
    tiles: {
      catalog: {
        title: 'Technical catalog',
        desc: 'Courses, books, scripts, frameworks and ready-to-use templates, with free previews and real reviews.',
        chips: ['Courses', 'Books', 'Scripts', 'Templates'],
        cta: 'Browse the catalog',
      },
      academy: {
        title: 'ASE Academy',
        desc: 'Course-games where you work at a fictional company, make decisions under real pressure and see their consequences.',
        cta: 'Play free',
      },
      jobs: {
        title: 'Jobs with fit analysis',
        desc: 'Tech and QA job offers, plus an AI analysis of how well your CV fits, your gaps and how to prepare the interview.',
      },
      consulting: {
        title: 'Senior QA consulting',
        desc: 'Quality strategy, automation and platform architecture, with 10+ years in critical environments.',
      },
      community: {
        title: 'Community and blog',
        desc: 'Quality engineering articles with comments, reactions and shares.',
      },
      loyalty: {
        title: 'Loyalty program',
        desc: 'Your tenure counts: rewards that grow level by level.',
        levels: ['Silver', 'Gold', 'Platinum', 'Infinite'],
      },
      teams: {
        title: 'Organizations and teams',
        desc: 'Multiple members, roles and permissions, audit log and your own billing.',
      },
      frameworks: {
        title: 'Automation frameworks',
        desc: 'Accelerators ready for CI/CD and parallel execution.',
      },
    },
  },
  academy: {
    eyebrow: 'ASE Academy',
    title: "You won't watch videos. You'll do the job.",
    subtitle:
      "Every mission is a real working day: meetings, deadlines, teammates with their own ideas and decisions with consequences. What you don't test turns into a bug you'll watch being born.",
    dayTitle: 'A day on the course',
    day: [
      { time: '09:15', text: 'The senior swears he has "100% coverage". There\'s a bug in production.' },
      { time: '11:30', text: 'The PO wants "just the happy path, we\'re short on time".' },
      { time: '13:00', text: 'Go / no-go. The checklist is green… so what do you recommend?' },
      {
        time: '17:00',
        text: 'Debrief: what you prevented, what slipped through and what a senior QA would have done.',
      },
    ],
    missions: 'playable missions',
    level: { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' },
    hours: 'h',
    cta: 'Play the first mission free',
    courseCta: 'See course',
  },
  catalog: {
    eyebrow: 'Catalog',
    title: 'Top rated in the catalog',
    subtitle: 'Technical resources with previews, reviews and instant download.',
    free: 'Free',
    cta: 'See the whole catalog',
    reviews: 'reviews',
    prev: 'Previous',
    next: 'Next',
  },
  audiences: {
    eyebrow: "Who it's for",
    title: 'Grows with you: from professional to organization',
    items: {
      pro: {
        title: 'Professionals',
        bullets: ['The whole catalog per your plan', 'Course-games and ISTQB® prep', 'Fit analysis against job offers'],
        cta: 'See plans',
      },
      teams: {
        title: 'Teams',
        bullets: [
          'Frameworks and templates to ship with quality',
          'Hands-on training for the whole team',
          'Shared, up-to-date resources',
        ],
        cta: 'See plans',
      },
      enterprise: {
        title: 'Companies',
        bullets: [
          'Organization with roles, permissions and audit',
          'Your own billing portal',
          'Senior QA consulting included',
        ],
        cta: 'Talk to ASE',
      },
    },
  },
  steps: {
    eyebrow: 'How it works',
    title: 'Get started in minutes',
    items: [
      { title: 'Pick your plan', text: 'Free to start; Pro, Business or Enterprise when you need them.' },
      { title: 'Access everything instantly', text: 'Catalog, Academy, jobs and community from day one.' },
      { title: 'Grow with the platform', text: 'Your tenure levels up and unlocks rewards.' },
    ],
  },
  finalCta: {
    title: 'Your next quality leap starts today.',
    subtitle: 'Try ASE Academy for free or pick the plan that fits you. No lock-in.',
    primary: 'See plans',
    secondary: 'Play free',
    tertiary: 'Talk to ASE',
  },
}
