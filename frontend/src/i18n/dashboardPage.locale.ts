/**
 * Private `/dashboard` copy (EN + ES). Merged into `translations.ts` as `dashboardPage`.
 *
 * Rule: no visible hardcoded strings in dashboard UI — everything comes from these keys.
 */

export const dashboardPageEn = {
  common: {
    na: '—',
  },
  units: {
    ms: 'ms',
  },
  hero: {
    greeting: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    unknownUser: 'Operator',
    activeOrgLabel: 'Active org',
    roleLabel: 'Role',
    systemLabel: 'System',
    systemOnline: 'online',
    systemDegraded: 'degraded',
    systemOffline: 'offline',
    quickActionsLabel: 'Quick actions',
    kpisLabel: 'Quick KPIs',
  },
  metrics: {
    organizations: {
      title: 'Organizations',
      subtitle: 'Active tenants',
      trendUp: '+12% this month',
      micro: '+3 active today',
    },
    users: {
      title: 'Users',
      subtitle: 'Members',
      trendUp: '+6% this month',
      micro: '2 pending invitations',
    },
    plans: {
      title: 'Plans',
      subtitle: 'Published catalog',
      trendUp: '+1 this week',
      micro: 'Entitlements ready',
    },
    products: {
      title: 'Products',
      subtitle: 'Catalog',
      trendUp: '+2 this month',
      micro: 'Most used: Core',
    },
    subscriptions: {
      title: 'Subscriptions',
      subtitle: 'Recurring',
      trendUp: '+4% this month',
      micro: '5 renewals today',
    },
  },
  activity: {
    badge: 'Platform activity',
    title: 'Platform activity',
    subtitle: 'Signals across tenants, users and subscriptions — designed for operators.',
    charts: {
      orgGrowth: 'Organizations growth',
      activeUsers: 'Active users',
      subsByPlan: 'Subscriptions by plan',
      productUsage: 'Product usage',
      timeline: 'Activity timeline',
    },
    planNames: { starter: 'Starter', team: 'Team', enterprise: 'Enterprise' },
    productNames: { core: 'Core', billing: 'Billing', rbac: 'RBAC', audit: 'Audit' },
    empty: {
      title: 'No activity yet',
      body: 'Once data flows through the platform, charts will reflect usage and governance signals.',
    },
  },
  health: {
    badge: 'System health',
    title: 'System health',
    subtitle: 'Service status and operational signals (latency, uptime, events).',
    services: {
      auth: 'Auth service',
      rbac: 'RBAC engine',
      billing: 'Billing',
      audit: 'Audit pipeline',
      notifications: 'Notifications',
      gateway: 'API gateway',
    },
    labels: {
      uptime: 'Uptime',
      latency: 'Latency',
      events: 'Events',
      ok: 'ok',
      degraded: 'degraded',
      offline: 'offline',
    },
  },
  feed: {
    badge: 'Recent activity',
    title: 'Recent activity',
    subtitle: 'A governed, traceable stream of operational events.',
    empty: {
      title: 'No events yet',
      body: 'Create an organization, invite members or update a subscription to start generating activity.',
      cta: 'Create organization',
    },
    eventTypes: {
      orgCreated: 'Organization created',
      roleAssigned: 'Role assigned',
      subscriptionUpdated: 'Subscription updated',
      invitationAccepted: 'Invitation accepted',
      productActivated: 'Product activated',
      auditEvent: 'Audit event',
    },
    mock: [
      { type: 'orgCreated', who: 'Acme', meta: 'tenant boundary provisioned', at: '2h' },
      { type: 'roleAssigned', who: 'org_admin', meta: 'policy linked', at: '5h' },
      { type: 'subscriptionUpdated', who: 'system', meta: 'renewal processed', at: '1d' },
      { type: 'productActivated', who: 'Northwind', meta: 'entitlements active', at: '3d' },
    ],
  },
  quickActions: {
    badge: 'Actions',
    title: 'Quick actions',
    subtitle: 'High-signal actions for operators and admins.',
    items: {
      createOrg: { title: 'Create organization', body: 'Provision a new tenant boundary with governance defaults.' },
      inviteMember: { title: 'Invite member', body: 'Add operators with scoped access and role policies.' },
      createProduct: { title: 'Create product', body: 'Define what customers can access and operate.' },
      createPlan: { title: 'Create plan', body: 'Packaging, limits and entitlements — wired to billing.' },
      viewAudit: { title: 'View audit logs', body: 'Trace actions, exports and governance signals.' },
    },
  },
  insights: {
    badge: 'Insights',
    title: 'Insights',
    subtitle: 'Operator-focused highlights — designed to surface what matters.',
    items: {
      mostUsedProduct: { title: 'Most used product', value: 'Core', hint: 'Based on recent activity' },
      activeSubscriptions: { title: 'Active subscriptions', value: '—', hint: 'Recurring access across tenants' },
      topOrg: { title: 'Highest activity org', value: '—', hint: 'Governance + ops events' },
      pendingInvites: { title: 'Pending invitations', value: '2', hint: 'Users awaiting acceptance' },
      lastAnomaly: { title: 'Last audit anomaly', value: '—', hint: 'No anomalies detected' },
    },
  },
} as const

export const dashboardPageEs = {
  common: {
    na: '—',
  },
  units: {
    ms: 'ms',
  },
  hero: {
    greeting: {
      morning: 'Buenos días',
      afternoon: 'Buenas tardes',
      evening: 'Buenas noches',
    },
    unknownUser: 'Operador',
    activeOrgLabel: 'Org activa',
    roleLabel: 'Rol',
    systemLabel: 'Sistema',
    systemOnline: 'online',
    systemDegraded: 'degradado',
    systemOffline: 'offline',
    quickActionsLabel: 'Acciones rápidas',
    kpisLabel: 'KPIs rápidos',
  },
  metrics: {
    organizations: {
      title: 'Organizaciones',
      subtitle: 'Tenants activos',
      trendUp: '+12% este mes',
      micro: '+3 activas hoy',
    },
    users: {
      title: 'Usuarios',
      subtitle: 'Miembros',
      trendUp: '+6% este mes',
      micro: '2 invitaciones pendientes',
    },
    plans: {
      title: 'Planes',
      subtitle: 'Catálogo publicado',
      trendUp: '+1 esta semana',
      micro: 'Entitlements listos',
    },
    products: {
      title: 'Productos',
      subtitle: 'Catálogo',
      trendUp: '+2 este mes',
      micro: 'Más usado: Core',
    },
    subscriptions: {
      title: 'Suscripciones',
      subtitle: 'Recurrente',
      trendUp: '+4% este mes',
      micro: '5 renovaciones hoy',
    },
  },
  activity: {
    badge: 'Actividad de plataforma',
    title: 'Actividad de plataforma',
    subtitle: 'Señales entre tenants, usuarios y suscripciones — pensado para operadores.',
    charts: {
      orgGrowth: 'Crecimiento de organizaciones',
      activeUsers: 'Usuarios activos',
      subsByPlan: 'Suscripciones por plan',
      productUsage: 'Uso de producto',
      timeline: 'Timeline de actividad',
    },
    planNames: { starter: 'Starter', team: 'Team', enterprise: 'Enterprise' },
    productNames: { core: 'Core', billing: 'Billing', rbac: 'RBAC', audit: 'Audit' },
    empty: {
      title: 'Aún no hay actividad',
      body: 'Cuando haya flujo de datos, las gráficas reflejarán uso y señales de gobernanza.',
    },
  },
  health: {
    badge: 'Salud del sistema',
    title: 'Salud del sistema',
    subtitle: 'Estado de servicios y señales operativas (latencia, uptime, eventos).',
    services: {
      auth: 'Servicio de auth',
      rbac: 'Motor RBAC',
      billing: 'Billing',
      audit: 'Pipeline de auditoría',
      notifications: 'Notificaciones',
      gateway: 'API gateway',
    },
    labels: {
      uptime: 'Uptime',
      latency: 'Latencia',
      events: 'Eventos',
      ok: 'ok',
      degraded: 'degradado',
      offline: 'offline',
    },
  },
  feed: {
    badge: 'Actividad reciente',
    title: 'Actividad reciente',
    subtitle: 'Un stream gobernado y trazable de eventos operativos.',
    empty: {
      title: 'Aún no hay eventos',
      body: 'Crea una organización, invita miembros o actualiza una suscripción para generar actividad.',
      cta: 'Crear organización',
    },
    eventTypes: {
      orgCreated: 'Organización creada',
      roleAssigned: 'Rol asignado',
      subscriptionUpdated: 'Suscripción actualizada',
      invitationAccepted: 'Invitación aceptada',
      productActivated: 'Producto activado',
      auditEvent: 'Evento de auditoría',
    },
    mock: [
      { type: 'orgCreated', who: 'Acme', meta: 'tenant provisionado', at: '2h' },
      { type: 'roleAssigned', who: 'org_admin', meta: 'política vinculada', at: '5h' },
      { type: 'subscriptionUpdated', who: 'system', meta: 'renovación procesada', at: '1d' },
      { type: 'productActivated', who: 'Northwind', meta: 'entitlements activos', at: '3d' },
    ],
  },
  quickActions: {
    badge: 'Acciones',
    title: 'Acciones rápidas',
    subtitle: 'Acciones de alto impacto para operadores y admins.',
    items: {
      createOrg: { title: 'Crear organización', body: 'Provisiona un tenant con defaults de gobernanza.' },
      inviteMember: { title: 'Invitar miembro', body: 'Añade operadores con acceso acotado y políticas de rol.' },
      createProduct: { title: 'Crear producto', body: 'Define qué puede acceder y operar el cliente.' },
      createPlan: { title: 'Crear plan', body: 'Paquetes, límites y entitlements — conectados a billing.' },
      viewAudit: { title: 'Ver logs de auditoría', body: 'Traza acciones, exports y señales de gobernanza.' },
    },
  },
  insights: {
    badge: 'Insights',
    title: 'Insights',
    subtitle: 'Highlights operativos para mostrar lo importante.',
    items: {
      mostUsedProduct: { title: 'Producto más usado', value: 'Core', hint: 'Basado en actividad reciente' },
      activeSubscriptions: { title: 'Suscripciones activas', value: '—', hint: 'Acceso recurrente entre tenants' },
      topOrg: { title: 'Org con más actividad', value: '—', hint: 'Eventos de gobernanza + ops' },
      pendingInvites: { title: 'Invitaciones pendientes', value: '2', hint: 'Usuarios pendientes de aceptar' },
      lastAnomaly: { title: 'Última anomalía', value: '—', hint: 'Sin anomalías detectadas' },
    },
  },
} as const

