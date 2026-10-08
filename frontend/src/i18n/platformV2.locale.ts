/**
 * Copy de la página pública «Plataforma» (/platform), EN + ES.
 * Lo consumen los componentes de `components/public/platform/v2/` vía `usePlatformCopy()`.
 */

export const platformV2Es = {
  meta: {
    title: 'Plataforma ASE',
    description:
      'La arquitectura detrás de ASE: multiorganización, roles y permisos, planes y suscripciones, auditoría, automatización y un stack moderno.',
  },
  hero: {
    eyebrow: 'Plataforma',
    titleBefore: 'La ingeniería',
    titleHighlight: 'que no se ve',
    titleAfter: ', pero se nota.',
    subtitle:
      'ASE funciona sobre una plataforma propia, multiorganización y con control de acceso por roles. La misma ingeniería que aplicamos en proyectos críticos, al servicio de tu aprendizaje y de tu equipo.',
    primaryCta: 'Ver qué incluye',
    secondaryCta: 'Hablar con ASE',
    core: 'ASE Core',
    coreSub: 'Plano de control',
    orbit: ['Identidad', 'Organizaciones', 'Roles', 'Catálogo', 'Suscripciones', 'Auditoría', 'Automatización', 'IA'],
    principles: [
      { label: 'Multiorganización', text: 'Fronteras estrictas entre organizaciones' },
      { label: 'Mínimo privilegio', text: 'Cada rol ve solo lo que necesita' },
      { label: 'API-first', text: 'Todo es una API documentada' },
      { label: 'Bilingüe', text: 'Español e inglés de serie' },
    ],
  },
  nav: {
    label: 'Secciones',
    flow: 'Flujo',
    tenancy: 'Multiorganización',
    rbac: 'Roles y permisos',
    billing: 'Planes',
    audit: 'Auditoría',
    automation: 'Automatización',
    dashboard: 'Panel',
    stack: 'Stack',
  },
  flow: {
    eyebrow: 'Flujo del sistema',
    title: 'De quién eres a lo que puedes hacer, en un solo camino',
    subtitle:
      'Cada petición recorre el mismo circuito: identidad, organización, permisos y plan. Por eso el acceso es coherente y todo queda registrado.',
    steps: [
      { title: 'Usuario', text: 'Identidad, sesión y organización activa.' },
      { title: 'Organización', text: 'Frontera de datos: miembros y gobierno propio.' },
      { title: 'Roles', text: 'Permisos según el rol en esa organización.' },
      { title: 'Catálogo', text: 'Productos y planes conectados al acceso.' },
      { title: 'Suscripción', text: 'Estado de pago que activa o retira acceso.' },
      { title: 'Operación', text: 'Paneles y flujos de trabajo del día a día.' },
      { title: 'Auditoría', text: 'Cada acción relevante deja rastro.' },
    ],
  },
  tenancy: {
    eyebrow: 'Multiorganización',
    title: 'Una persona, varias organizaciones, ninguna fuga de datos',
    subtitle:
      'Puedes pertenecer a tu empresa y a un cliente a la vez, con un rol distinto en cada una. El acceso se evalúa siempre en el contexto de la organización activa.',
    bullets: [
      'Cada organización gestiona sus miembros, productos y suscripciones',
      'Roles distintos por organización para la misma persona',
      'La organización activa decide qué ves y qué puedes hacer',
      'Aislamiento entre organizaciones por diseño',
    ],
    you: 'Tú',
    active: 'Contexto activo',
    orgA: 'Acme Bank',
    orgB: 'Northwind Retail',
    roleLabel: 'Rol',
    roleA: 'Administrador',
    roleB: 'Lector',
    products: 'productos',
    subscription: 'Suscripción',
    subActive: 'Activa',
    subTrial: 'Prueba',
    boundary: 'Frontera de datos',
    example: 'Ejemplo ilustrativo',
  },
  rbac: {
    eyebrow: 'Roles y permisos',
    title: 'Cada rol ve exactamente lo que necesita',
    subtitle:
      'Un modelo jerárquico de roles pensado para empresas: gobierno sin frenar al equipo. Elige un rol para ver qué puede hacer.',
    matrixTitle: 'Matriz de permisos',
    allowed: 'Permitido',
    denied: 'Sin acceso',
    note: 'Resumen simplificado del modelo de roles.',
    roles: [
      { id: 'super_admin', name: 'Superadministrador', text: 'Gobierno global de la plataforma.' },
      { id: 'org_owner', name: 'Propietario', text: 'Responde de la organización y su facturación.' },
      { id: 'org_admin', name: 'Administrador', text: 'Gestiona miembros, roles y configuración.' },
      { id: 'member', name: 'Miembro', text: 'Usa los productos que tiene asignados.' },
      { id: 'viewer', name: 'Lector', text: 'Solo lectura, para auditorías y seguimiento.' },
    ],
    capabilities: [
      'Usar productos asignados',
      'Ver informes y actividad',
      'Gestionar miembros',
      'Asignar roles',
      'Gestionar catálogo de la organización',
      'Facturación y plan',
      'Configuración global',
    ],
  },
  billing: {
    eyebrow: 'Planes y suscripciones',
    title: 'Tu plan decide qué se abre, al instante',
    subtitle:
      'Productos, planes y suscripciones funcionan como en un SaaS de verdad: el plan concede accesos y la suscripción los activa. Subes de plan sin perder nada por el camino.',
    pipeline: [
      { title: 'Producto', text: 'Lo que usas: cursos, libros, recursos.' },
      { title: 'Plan', text: 'El paquete que lo agrupa.' },
      { title: 'Acceso', text: 'Se evalúa en tiempo real.' },
      { title: 'Suscripción', text: 'Pago seguro con Stripe.' },
    ],
    plans: ['{{plan:1}}', '{{plan:2}}', '{{plan:3}}', '{{plan:top}}'],
    ladderTitle: 'Crece de plan sin migraciones',
    ladderNote: 'Tu historial, tu biblioteca y tu antigüedad viajan contigo.',
  },
  audit: {
    eyebrow: 'Auditoría',
    title: 'Todo lo importante queda registrado',
    subtitle:
      'Cambios de rol, renovaciones, accesos concedidos: un registro de auditoría con quién, qué y cuándo, para que cualquier decisión se pueda explicar después.',
    streamTitle: 'Actividad en tiempo real',
    live: 'En directo',
    events: [
      { event: 'Rol actualizado', actor: 'Administrador', tone: 'brand' },
      { event: 'Suscripción renovada', actor: 'Sistema', tone: 'emerald' },
      { event: 'Acceso concedido', actor: 'Propietario', tone: 'cyan' },
      { event: 'Miembro invitado', actor: 'Administrador', tone: 'violet' },
      { event: 'Exportación de auditoría', actor: 'Lector', tone: 'amber' },
      { event: 'Plan actualizado a {{plan:3}}', actor: 'Propietario', tone: 'emerald' },
    ],
    ago: ['ahora', 'hace 2 min', 'hace 12 min', 'hace 1 h', 'hace 3 h', 'ayer'],
    indicators: ['Trazabilidad', 'Evidencias', 'Revisión de políticas', 'Alertas operativas'],
  },
  automation: {
    eyebrow: 'Automatización',
    title: 'Preparada para automatizar, con IA donde aporta',
    subtitle:
      'Eventos, tareas programadas e integraciones sobre las mismas piezas gobernadas. La IA ya trabaja dentro de ASE: por ejemplo, en el análisis de encaje de tu CV con cada oferta.',
    stages: [
      { title: 'Disparadores', items: ['Eventos', 'Programación', 'Webhooks'] },
      { title: 'Acciones', items: ['Notificaciones', 'Aprobaciones', 'Sincronización'] },
      { title: 'Integraciones', items: ['Email', 'Webhooks', 'APIs internas'] },
      { title: 'IA', items: ['Analizar', 'Resumir', 'Clasificar'] },
    ],
  },
  dashboard: {
    eyebrow: 'Panel de operación',
    title: 'Un panel pensado para quien opera, no para impresionar',
    subtitle:
      'Claridad, gobierno y control del día a día: organizaciones, usuarios, suscripciones y alertas en una sola vista.',
    kpis: [
      { label: 'Organizaciones', value: '12', delta: '+2' },
      { label: 'Usuarios', value: '284', delta: '+18' },
      { label: 'Suscripciones', value: '46', delta: '+5' },
      { label: 'Alertas', value: '3', delta: '' },
    ],
    chartTitle: 'Usuarios activos · 12 semanas',
    mixTitle: 'Suscripciones por plan',
    activityTitle: 'Actividad reciente',
    activity: [
      ['Política de roles actualizada', 'Acme', '2 min'],
      ['Cambio a {{plan:3}}', 'Northwind', '1 h'],
      ['Exportación de auditoría', 'Globex', '1 d'],
    ],
    simulated: 'Datos simulados',
  },
  stack: {
    eyebrow: 'Stack tecnológico',
    title: 'Tecnología probada, sin modas',
    subtitle:
      'Las mismas piezas que recomendamos a nuestros clientes: tipado de extremo a extremo, migraciones versionadas, pagos seguros y observabilidad desde el primer día.',
    layers: [
      { title: 'Interfaz', items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'] },
      { title: 'Servicios', items: ['FastAPI', 'SQLAlchemy', 'Alembic'] },
      { title: 'Datos', items: ['PostgreSQL', 'Redis'] },
      { title: 'Pagos y observabilidad', items: ['Stripe', 'Sentry'] },
    ],
    principles: [
      { title: 'Aislamiento por diseño', text: 'Los datos de cada organización viven tras su propia frontera.' },
      { title: 'Mínimo privilegio', text: 'Ningún rol tiene más permisos de los que necesita.' },
      { title: 'Trazabilidad', text: 'Las acciones sensibles dejan evidencia auditable.' },
      { title: 'Calidad automatizada', text: 'Pruebas unitarias y de extremo a extremo como parte del desarrollo.' },
    ],
  },
  final: {
    title: '¿Quieres esta ingeniería en tu producto?',
    subtitle:
      'Te ayudamos a definir módulos, modelo de gobierno y plan de entrega. O empieza por ver todo lo que incluye ASE.',
    primary: 'Hablar con ASE',
    secondary: 'Ver qué incluye',
    tertiary: 'Acceso clientes',
  },
}

export const platformV2En: typeof platformV2Es = {
  meta: {
    title: 'ASE Platform',
    description:
      'The architecture behind ASE: multi-organization, roles and permissions, plans and subscriptions, audit, automation and a modern stack.',
  },
  hero: {
    eyebrow: 'Platform',
    titleBefore: 'The engineering',
    titleHighlight: "you don't see",
    titleAfter: ', but you notice.',
    subtitle:
      'ASE runs on its own multi-organization platform with role-based access control. The same engineering we apply to critical projects, working for your learning and your team.',
    primaryCta: "See what's included",
    secondaryCta: 'Talk to ASE',
    core: 'ASE Core',
    coreSub: 'Control plane',
    orbit: ['Identity', 'Organizations', 'Roles', 'Catalog', 'Subscriptions', 'Audit', 'Automation', 'AI'],
    principles: [
      { label: 'Multi-organization', text: 'Strict boundaries between organizations' },
      { label: 'Least privilege', text: 'Each role sees only what it needs' },
      { label: 'API-first', text: 'Everything is a documented API' },
      { label: 'Bilingual', text: 'Spanish and English built in' },
    ],
  },
  nav: {
    label: 'Sections',
    flow: 'Flow',
    tenancy: 'Multi-organization',
    rbac: 'Roles & permissions',
    billing: 'Plans',
    audit: 'Audit',
    automation: 'Automation',
    dashboard: 'Dashboard',
    stack: 'Stack',
  },
  flow: {
    eyebrow: 'System flow',
    title: 'From who you are to what you can do, in a single path',
    subtitle:
      'Every request goes through the same circuit: identity, organization, permissions and plan. That keeps access consistent and everything recorded.',
    steps: [
      { title: 'User', text: 'Identity, session and active organization.' },
      { title: 'Organization', text: 'Data boundary: members and its own governance.' },
      { title: 'Roles', text: 'Permissions based on the role in that organization.' },
      { title: 'Catalog', text: 'Products and plans wired to access.' },
      { title: 'Subscription', text: 'Payment state that grants or revokes access.' },
      { title: 'Operations', text: 'Day-to-day dashboards and workflows.' },
      { title: 'Audit', text: 'Every relevant action leaves a trail.' },
    ],
  },
  tenancy: {
    eyebrow: 'Multi-organization',
    title: 'One person, several organizations, zero data leaks',
    subtitle:
      'You can belong to your company and to a client at the same time, with a different role in each. Access is always evaluated in the active organization context.',
    bullets: [
      'Each organization manages its members, products and subscriptions',
      'Different roles per organization for the same person',
      'The active organization decides what you see and can do',
      'Isolation between organizations by design',
    ],
    you: 'You',
    active: 'Active context',
    orgA: 'Acme Bank',
    orgB: 'Northwind Retail',
    roleLabel: 'Role',
    roleA: 'Admin',
    roleB: 'Viewer',
    products: 'products',
    subscription: 'Subscription',
    subActive: 'Active',
    subTrial: 'Trial',
    boundary: 'Data boundary',
    example: 'Illustrative example',
  },
  rbac: {
    eyebrow: 'Roles and permissions',
    title: 'Each role sees exactly what it needs',
    subtitle:
      'A hierarchical role model built for companies: governance without slowing the team down. Pick a role to see what it can do.',
    matrixTitle: 'Permission matrix',
    allowed: 'Allowed',
    denied: 'No access',
    note: 'Simplified summary of the role model.',
    roles: [
      { id: 'super_admin', name: 'Super admin', text: 'Global platform governance.' },
      { id: 'org_owner', name: 'Owner', text: 'Accountable for the organization and its billing.' },
      { id: 'org_admin', name: 'Admin', text: 'Manages members, roles and settings.' },
      { id: 'member', name: 'Member', text: 'Uses the products assigned to them.' },
      { id: 'viewer', name: 'Viewer', text: 'Read-only, for audits and follow-up.' },
    ],
    capabilities: [
      'Use assigned products',
      'View reports and activity',
      'Manage members',
      'Assign roles',
      'Manage organization catalog',
      'Billing and plan',
      'Global settings',
    ],
  },
  billing: {
    eyebrow: 'Plans and subscriptions',
    title: 'Your plan decides what opens, instantly',
    subtitle:
      'Products, plans and subscriptions work like a real SaaS: the plan grants access and the subscription activates it. Upgrade without losing anything along the way.',
    pipeline: [
      { title: 'Product', text: 'What you use: courses, books, resources.' },
      { title: 'Plan', text: 'The package that groups them.' },
      { title: 'Access', text: 'Evaluated in real time.' },
      { title: 'Subscription', text: 'Secure payment with Stripe.' },
    ],
    plans: ['{{plan:1}}', '{{plan:2}}', '{{plan:3}}', '{{plan:top}}'],
    ladderTitle: 'Upgrade without migrations',
    ladderNote: 'Your history, your library and your tenure come with you.',
  },
  audit: {
    eyebrow: 'Audit',
    title: 'Everything important is recorded',
    subtitle:
      'Role changes, renewals, granted access: an audit log with who, what and when, so any decision can be explained later.',
    streamTitle: 'Real-time activity',
    live: 'Live',
    events: [
      { event: 'Role updated', actor: 'Admin', tone: 'brand' },
      { event: 'Subscription renewed', actor: 'System', tone: 'emerald' },
      { event: 'Access granted', actor: 'Owner', tone: 'cyan' },
      { event: 'Member invited', actor: 'Admin', tone: 'violet' },
      { event: 'Audit export', actor: 'Viewer', tone: 'amber' },
      { event: 'Plan upgraded to {{plan:3}}', actor: 'Owner', tone: 'emerald' },
    ],
    ago: ['now', '2 min ago', '12 min ago', '1 h ago', '3 h ago', 'yesterday'],
    indicators: ['Traceability', 'Evidence', 'Policy review', 'Operational alerts'],
  },
  automation: {
    eyebrow: 'Automation',
    title: 'Ready to automate, with AI where it helps',
    subtitle:
      'Events, scheduled jobs and integrations on the same governed building blocks. AI already works inside ASE: for example, in the fit analysis between your CV and each job offer.',
    stages: [
      { title: 'Triggers', items: ['Events', 'Schedules', 'Webhooks'] },
      { title: 'Actions', items: ['Notifications', 'Approvals', 'Sync'] },
      { title: 'Integrations', items: ['Email', 'Webhooks', 'Internal APIs'] },
      { title: 'AI', items: ['Analyze', 'Summarize', 'Classify'] },
    ],
  },
  dashboard: {
    eyebrow: 'Operations dashboard',
    title: 'A dashboard built for operators, not for show',
    subtitle:
      'Clarity, governance and day-to-day control: organizations, users, subscriptions and alerts in a single view.',
    kpis: [
      { label: 'Organizations', value: '12', delta: '+2' },
      { label: 'Users', value: '284', delta: '+18' },
      { label: 'Subscriptions', value: '46', delta: '+5' },
      { label: 'Alerts', value: '3', delta: '' },
    ],
    chartTitle: 'Active users · 12 weeks',
    mixTitle: 'Subscriptions by plan',
    activityTitle: 'Recent activity',
    activity: [
      ['Role policy updated', 'Acme', '2 min'],
      ['Upgraded to {{plan:3}}', 'Northwind', '1 h'],
      ['Audit export', 'Globex', '1 d'],
    ],
    simulated: 'Simulated data',
  },
  stack: {
    eyebrow: 'Tech stack',
    title: 'Proven technology, no fads',
    subtitle:
      'The same pieces we recommend to our clients: end-to-end typing, versioned migrations, secure payments and observability from day one.',
    layers: [
      { title: 'Interface', items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'] },
      { title: 'Services', items: ['FastAPI', 'SQLAlchemy', 'Alembic'] },
      { title: 'Data', items: ['PostgreSQL', 'Redis'] },
      { title: 'Payments and observability', items: ['Stripe', 'Sentry'] },
    ],
    principles: [
      { title: 'Isolation by design', text: "Each organization's data lives behind its own boundary." },
      { title: 'Least privilege', text: 'No role has more permissions than it needs.' },
      { title: 'Traceability', text: 'Sensitive actions leave auditable evidence.' },
      { title: 'Automated quality', text: 'Unit and end-to-end tests as part of development.' },
    ],
  },
  final: {
    title: 'Want this engineering in your product?',
    subtitle:
      'We help you define modules, governance model and delivery plan. Or start by seeing everything ASE includes.',
    primary: 'Talk to ASE',
    secondary: "See what's included",
    tertiary: 'Client login',
  },
}
