/**
 * Public `/platform` page copy (EN + ES). Merged into `translations.ts` as `platformPage`.
 *
 * Rule: no visible hardcoded strings in PlatformPage UI — everything comes from these keys.
 */

export const platformPageEn = {
  hero: {
    badge: 'Platform',
    title: 'The infrastructure behind ASE',
    subtitle:
      'A multi-tenant architecture designed for organizations, automation, digital products and modern enterprise operations.',
    ctas: {
      services: 'Explore services',
      contact: 'Contact',
      login: 'Client login',
    },
    metrics: {
      tenancy: { label: 'Tenancy', value: 'Multi-tenant' },
      governance: { label: 'Governance', value: 'RBAC-first' },
      posture: { label: 'Posture', value: 'API-first' },
    },
    preview: {
      badge: 'Architecture preview',
      title: 'Unified control plane',
      subtitle: 'Organizations · RBAC · Billing · Products · Audit',
      pills: ['Tenant context', 'Policies', 'Events', 'Observability'],
    },
  },
  diagram: {
    badge: 'System flow',
    title: 'From user identity to governed operations',
    subtitle: 'A single, connected path that keeps access, entitlements and auditability consistent.',
    nodes: {
      user: {
        title: 'User',
        description: 'Identity, sessions and active organization context.',
        micro: ['Sessions', 'Context'],
      },
      org: {
        title: 'Organization',
        description: 'Tenant boundary: members, roles and operational governance.',
        micro: ['Tenant', 'Members'],
      },
      rbac: {
        title: 'Roles & Permissions',
        description: 'Contextual RBAC aligned to enterprise ownership and workflows.',
        micro: ['Policies', 'Scopes'],
      },
      catalog: {
        title: 'Products & Plans',
        description: 'Catalog primitives wired to entitlements and monetization.',
        micro: ['Plans', 'Products'],
      },
      subs: {
        title: 'Subscriptions',
        description: 'Lifecycle, billing state and access control via entitlements.',
        micro: ['Billing', 'Entitlements'],
      },
      ops: {
        title: 'Dashboards & Workflows',
        description: 'Operator UX and automation-ready workflows for daily operations.',
        micro: ['Ops UX', 'Automation'],
      },
      audit: {
        title: 'Audit & Governance',
        description: 'Traceability, audit logs and operational visibility by design.',
        micro: ['Logs', 'Controls'],
      },
    },
  },
  multiTenant: {
    badge: 'Multi-tenant',
    title: 'How multi-tenant works',
    subtitle: 'One user can belong to multiple organizations — with strict tenant boundaries and contextual RBAC.',
    bullets: [
      'A user can join multiple organizations with distinct roles.',
      'Each organization owns its members, products, plans and subscriptions.',
      'Access is evaluated in the active tenant context.',
      'Isolation boundaries prevent cross-tenant data leakage by design.',
    ],
    visual: {
      activeContext: 'Active context',
      boundary: 'Tenant boundary',
      roles: 'Roles',
      assignments: 'Assignments',
      products: 'Products',
      subscriptions: 'Subscriptions',
      orgs: { orgA: 'Organization A', orgB: 'Organization B' },
      values: {
        roleAdmin: 'org_admin',
        roleViewer: 'viewer',
        products2: '2',
        products1: '1',
        subsActive: 'active',
        subsTrial: 'trial',
        accessScoped: 'scoped',
        accessRead: 'read',
      },
    },
  },
  rbac: {
    badge: 'RBAC engine',
    title: 'Roles & permissions engine',
    subtitle: 'A hierarchy and policy model designed for enterprise governance — without slowing teams down.',
    roles: {
      super_admin: { title: 'super_admin', description: 'Global operator with emergency override and platform governance.' },
      org_owner: { title: 'org_owner', description: 'Accountable for organization settings, billing and ownership.' },
      org_admin: { title: 'org_admin', description: 'Manages members, roles and operational configuration.' },
      member: { title: 'member', description: 'Default contributor with scoped access to assigned products.' },
      viewer: { title: 'viewer', description: 'Read-only access for audits and visibility workflows.' },
    },
    capabilityGroups: {
      identity: { title: 'Identity', items: ['Login', 'Sessions', 'User lifecycle'] },
      governance: { title: 'Governance', items: ['Roles', 'Permissions', 'Policies'] },
      commerce: { title: 'Commerce', items: ['Plans', 'Subscriptions', 'Entitlements'] },
      operations: { title: 'Operations', items: ['Dashboards', 'Workflows', 'Audit logs'] },
    },
    hint: 'Hover a role to trace its capability boundaries.',
  },
  billing: {
    badge: 'Billing & entitlements',
    title: 'Products, plans and entitlements',
    subtitle: 'Monetization primitives that behave like a real SaaS platform — plans grant entitlements, subscriptions activate access.',
    flow: {
      products: { title: 'Products', description: 'Your catalog: what customers buy and use.' },
      plans: { title: 'Plans', description: 'Packaging and limits that define entitlements.' },
      entitlements: { title: 'Entitlements', description: 'Feature access evaluated at runtime per tenant.' },
      upgrades: { title: 'Upgrade path', description: 'Move between plans without breaking governance.' },
    },
    planNames: { starter: 'Starter', team: 'Team', enterprise: 'Enterprise' },
    planBadges: { current: 'Current', recommended: 'Recommended' },
    planBullets: {
      starter: ['Core modules', 'Single workspace', 'Basic governance'],
      team: ['Organizations', 'RBAC policies', 'Subscription ops'],
      enterprise: ['Audit-grade controls', 'Custom entitlements', 'Operator UX'],
    },
  },
  audit: {
    badge: 'Governance',
    title: 'Operational visibility and governance',
    subtitle: 'Audit logs, traceability and operational events — wired into the platform’s core.',
    stream: {
      title: 'Activity stream',
      cols: { event: 'Event', actor: 'Actor', meta: 'Meta' },
      rows: [
        { event: 'Role updated', actor: 'org_admin', meta: '2m' },
        { event: 'Subscription renewed', actor: 'system', meta: '12m' },
        { event: 'Entitlement granted', actor: 'org_owner', meta: '1h' },
      ],
    },
    indicators: {
      title: 'Governance indicators',
      items: ['Traceability', 'Evidence trails', 'Policy checks', 'Operator alerts'],
    },
  },
  workflows: {
    badge: 'Automation-ready',
    title: 'Automation-ready architecture',
    subtitle: 'Workflows, notifications, integrations and AI automation — built on governed primitives.',
    pipeline: {
      triggers: { title: 'Triggers', items: ['Events', 'Schedules', 'Webhooks'] },
      actions: { title: 'Actions', items: ['Notifications', 'Approvals', 'Sync jobs'] },
      integrations: { title: 'Integrations', items: ['Slack', 'Email', 'Webhooks', 'Internal APIs'] },
      ai: { title: 'AI automation', items: ['Assist', 'Summarize', 'Classify', 'Route'] },
    },
  },
  dashboard: {
    badge: 'Operator UX',
    title: 'Admin dashboard preview',
    subtitle: 'A simulated operational dashboard — designed for clarity, governance and day‑to‑day control.',
    cards: {
      orgs: { title: 'Organizations', value: '12', caption: 'Active tenants' },
      users: { title: 'Users', value: '284', caption: 'Members' },
      subs: { title: 'Subscriptions', value: '46', caption: 'Recurring' },
      alerts: { title: 'Alerts', value: '3', caption: 'Needs attention' },
    },
    charts: {
      title: 'Operational signals',
      legend: ['Access', 'Billing', 'Governance', 'Automation'],
    },
    table: {
      title: 'Recent activity',
      headers: ['Event', 'Org', 'When'],
      rows: [
        ['RBAC policy updated', 'Acme', '2m'],
        ['Plan upgraded', 'Northwind', '1h'],
        ['Audit export', 'Globex', '1d'],
      ],
    },
  },
  cta: {
    badge: 'Next step',
    title: 'Want to map your platform architecture to these primitives?',
    subtitle: 'We can help you scope the right modules, governance model and delivery plan.',
    primary: 'Explore services',
    secondary: 'Contact',
    tertiary: 'Client login',
  },
  states: {
    comingSoon: 'This section is being refined.',
  },
} as const

export const platformPageEs = {
  hero: {
    badge: 'Plataforma',
    title: 'La infraestructura detrás de ASE',
    subtitle:
      'Una arquitectura multi-tenant diseñada para organizaciones, automatización, productos digitales y operaciones empresariales modernas.',
    ctas: {
      services: 'Explorar servicios',
      contact: 'Contacto',
      login: 'Acceso clientes',
    },
    metrics: {
      tenancy: { label: 'Tenancy', value: 'Multi-tenant' },
      governance: { label: 'Gobernanza', value: 'RBAC-first' },
      posture: { label: 'Postura', value: 'API-first' },
    },
    preview: {
      badge: 'Vista de arquitectura',
      title: 'Plano de control unificado',
      subtitle: 'Organizaciones · RBAC · Facturación · Productos · Auditoría',
      pills: ['Contexto de tenant', 'Políticas', 'Eventos', 'Observabilidad'],
    },
  },
  diagram: {
    badge: 'Flujo del sistema',
    title: 'De identidad a operaciones gobernadas',
    subtitle: 'Un camino conectado que mantiene acceso, entitlements y auditoría consistentes.',
    nodes: {
      user: {
        title: 'Usuario',
        description: 'Identidad, sesiones y contexto activo de organización.',
        micro: ['Sesiones', 'Contexto'],
      },
      org: {
        title: 'Organización',
        description: 'Frontera de tenant: miembros, roles y gobernanza operativa.',
        micro: ['Tenant', 'Miembros'],
      },
      rbac: {
        title: 'Roles y permisos',
        description: 'RBAC contextual alineado a ownership y workflows enterprise.',
        micro: ['Políticas', 'Scopes'],
      },
      catalog: {
        title: 'Productos y planes',
        description: 'Primitivas de catálogo conectadas a entitlements y monetización.',
        micro: ['Planes', 'Productos'],
      },
      subs: {
        title: 'Suscripciones',
        description: 'Ciclo de vida, estado de billing y control de acceso por entitlements.',
        micro: ['Billing', 'Entitlements'],
      },
      ops: {
        title: 'Dashboards y workflows',
        description: 'UX operativa y workflows listos para automatización.',
        micro: ['UX ops', 'Automatización'],
      },
      audit: {
        title: 'Auditoría y gobernanza',
        description: 'Trazabilidad, logs de auditoría y visibilidad operativa por diseño.',
        micro: ['Logs', 'Controles'],
      },
    },
  },
  multiTenant: {
    badge: 'Multi-tenant',
    title: 'Cómo funciona el multi-tenant',
    subtitle: 'Un usuario puede pertenecer a múltiples organizaciones — con fronteras estrictas y RBAC contextual.',
    bullets: [
      'Un usuario puede unirse a múltiples organizaciones con roles distintos.',
      'Cada organización gestiona miembros, productos, planes y suscripciones.',
      'El acceso se evalúa en el contexto del tenant activo.',
      'El aislamiento evita fugas cross-tenant por diseño.',
    ],
    visual: {
      activeContext: 'Contexto activo',
      boundary: 'Frontera de tenant',
      roles: 'Roles',
      assignments: 'Asignaciones',
      products: 'Productos',
      subscriptions: 'Suscripciones',
      orgs: { orgA: 'Organización A', orgB: 'Organización B' },
      values: {
        roleAdmin: 'org_admin',
        roleViewer: 'viewer',
        products2: '2',
        products1: '1',
        subsActive: 'activa',
        subsTrial: 'trial',
        accessScoped: 'acotado',
        accessRead: 'lectura',
      },
    },
  },
  rbac: {
    badge: 'Motor RBAC',
    title: 'Motor de roles y permisos',
    subtitle: 'Jerarquía y políticas pensadas para gobernanza enterprise — sin frenar al equipo.',
    roles: {
      super_admin: { title: 'super_admin', description: 'Operador global con override de emergencia y gobernanza de plataforma.' },
      org_owner: { title: 'org_owner', description: 'Responsable de settings, billing y ownership de la organización.' },
      org_admin: { title: 'org_admin', description: 'Gestiona miembros, roles y configuración operativa.' },
      member: { title: 'member', description: 'Contribuidor por defecto con acceso acotado a productos asignados.' },
      viewer: { title: 'viewer', description: 'Acceso de solo lectura para auditorías y visibilidad.' },
    },
    capabilityGroups: {
      identity: { title: 'Identidad', items: ['Acceso', 'Sesiones', 'Ciclo de usuario'] },
      governance: { title: 'Gobernanza', items: ['Roles', 'Permisos', 'Políticas'] },
      commerce: { title: 'Monetización', items: ['Planes', 'Suscripciones', 'Entitlements'] },
      operations: { title: 'Operación', items: ['Dashboards', 'Workflows', 'Logs de auditoría'] },
    },
    hint: 'Pasa el cursor por un rol para ver sus fronteras de capacidades.',
  },
  billing: {
    badge: 'Billing y entitlements',
    title: 'Productos, planes y entitlements',
    subtitle: 'Primitivas de monetización como una plataforma SaaS real: planes otorgan entitlements y suscripciones activan acceso.',
    flow: {
      products: { title: 'Productos', description: 'Tu catálogo: lo que el cliente compra y usa.' },
      plans: { title: 'Planes', description: 'Paquetes y límites que definen entitlements.' },
      entitlements: { title: 'Entitlements', description: 'Acceso evaluado en runtime por tenant.' },
      upgrades: { title: 'Ruta de upgrade', description: 'Cambios de plan sin romper gobernanza.' },
    },
    planNames: { starter: 'Starter', team: 'Team', enterprise: 'Enterprise' },
    planBadges: { current: 'Actual', recommended: 'Recomendado' },
    planBullets: {
      starter: ['Módulos core', 'Un workspace', 'Gobernanza básica'],
      team: ['Organizaciones', 'Políticas RBAC', 'Operación de suscripciones'],
      enterprise: ['Controles auditables', 'Entitlements a medida', 'UX operativa'],
    },
  },
  audit: {
    badge: 'Gobernanza',
    title: 'Visibilidad operativa y gobernanza',
    subtitle: 'Logs de auditoría, trazabilidad y eventos operativos — conectados al core.',
    stream: {
      title: 'Actividad',
      cols: { event: 'Evento', actor: 'Actor', meta: 'Meta' },
      rows: [
        { event: 'Rol actualizado', actor: 'org_admin', meta: '2m' },
        { event: 'Suscripción renovada', actor: 'system', meta: '12m' },
        { event: 'Entitlement concedido', actor: 'org_owner', meta: '1h' },
      ],
    },
    indicators: {
      title: 'Indicadores de gobernanza',
      items: ['Trazabilidad', 'Evidencias', 'Checks de políticas', 'Alertas operativas'],
    },
  },
  workflows: {
    badge: 'Listo para automatizar',
    title: 'Arquitectura preparada para automatización',
    subtitle: 'Workflows, notificaciones, integraciones y automatización con IA — sobre primitivas gobernadas.',
    pipeline: {
      triggers: { title: 'Triggers', items: ['Eventos', 'Schedules', 'Webhooks'] },
      actions: { title: 'Acciones', items: ['Notificaciones', 'Aprobaciones', 'Sincronizaciones'] },
      integrations: { title: 'Integraciones', items: ['Slack', 'Email', 'Webhooks', 'APIs internas'] },
      ai: { title: 'Automatización con IA', items: ['Asistir', 'Resumir', 'Clasificar', 'Enrutar'] },
    },
  },
  dashboard: {
    badge: 'UX operativa',
    title: 'Vista de dashboard admin',
    subtitle: 'Dashboard simulado para operación diaria — diseñado para claridad, gobernanza y control.',
    cards: {
      orgs: { title: 'Organizaciones', value: '12', caption: 'Tenants activos' },
      users: { title: 'Usuarios', value: '284', caption: 'Miembros' },
      subs: { title: 'Suscripciones', value: '46', caption: 'Recurrente' },
      alerts: { title: 'Alertas', value: '3', caption: 'Requiere atención' },
    },
    charts: {
      title: 'Señales operativas',
      legend: ['Acceso', 'Billing', 'Gobernanza', 'Automatización'],
    },
    table: {
      title: 'Actividad reciente',
      headers: ['Evento', 'Org', 'Cuándo'],
      rows: [
        ['Política RBAC actualizada', 'Acme', '2m'],
        ['Upgrade de plan', 'Northwind', '1h'],
        ['Export de auditoría', 'Globex', '1d'],
      ],
    },
  },
  cta: {
    badge: 'Siguiente paso',
    title: '¿Quieres mapear tu arquitectura a estas primitivas?',
    subtitle: 'Te ayudamos a acotar módulos, modelo de gobernanza y plan de entrega.',
    primary: 'Explorar servicios',
    secondary: 'Contacto',
    tertiary: 'Acceso clientes',
  },
  states: {
    comingSoon: 'Esta sección se está refinando.',
  },
} as const

