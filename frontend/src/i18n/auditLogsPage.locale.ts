/**
 * Private `/audit-logs` copy (EN + ES). Merged into `translations.ts` as `auditLogsPage`.
 */

export const auditLogsPageEn = {
  title: 'Audit',
  subtitle: 'Record of events, actions, and changes performed within the platform.',
  stats: {
    total: 'Total events',
    organizations: 'Affected organizations',
    actors: 'Unique actors',
    today: 'Events today',
  },
  filters: {
    title: 'Audit filters',
    organization: 'Organization',
    actor: 'Actor / User',
    entityType: 'Entity type',
    action: 'Action',
    dateFrom: 'Date from',
    dateTo: 'Date to',
    reset: 'Reset filters',
    all: 'All',
  },
  list: {
    title: 'Audit events',
    subtitle: 'Review events registered in the system.',
    meta: {
      updating: 'Updating...',
      total: '{{count}} events',
    },
    columns: {
      date: 'Date and time',
      actor: 'Actor',
      organization: 'Organization',
      action: 'Action',
      entity: 'Entity',
      detail: 'Detail',
      actions: 'Actions',
    },
  },
  realtime: {
    title: 'Real-time activity',
    live: 'Live',
  },
  summary: {
    title: 'Action summary',
    created: 'Created',
    updated: 'Updated',
    deleted: 'Deleted',
    login: 'Logins',
    failedLogin: 'Failed logins',
  },
  topEntities: {
    title: 'Top modified entities',
  },
  actions: {
    view: 'View detail',
    close: 'Close',
  },
  detail: {
    title: 'Event detail',
  },
  empty: {
    title: 'No audit events',
    subtitle: 'Adjust filters or run the demo seed to populate the audit trail.',
  },
  loading: 'Loading audit events...',
  error: 'We could not load audit events. Please try again.',
  placeholders: {
    organization: 'All organizations',
    actor: 'All actors',
    entityType: 'All entities',
    action: 'All actions',
  },
  actors: {
    system: 'System',
    unknown: 'Unknown actor',
  },
  organizations: {
    platform: 'Platform',
    unknown: 'Unassigned',
  },
  detailFallback: 'Platform audit event recorded.',
  relative: {
    now: 'Just now',
    minutes: '{{count}} min ago',
    hours: '{{count}} h ago',
    days: '{{count}} d ago',
  },
  entities: {
    User: 'User',
    Organization: 'Organization',
    Plan: 'Plan',
    Subscription: 'Subscription',
    Product: 'Product',
    Course: 'Course',
    Auth: 'Auth',
  },
}

export const auditLogsPageEs = {
  title: 'Auditoría',
  subtitle: 'Registro de eventos, acciones y cambios realizados dentro de la plataforma.',
  stats: {
    total: 'Eventos totales',
    organizations: 'Organizaciones afectadas',
    actors: 'Actores únicos',
    today: 'Eventos hoy',
  },
  filters: {
    title: 'Filtros de auditoría',
    organization: 'Organización',
    actor: 'Actor / Usuario',
    entityType: 'Tipo de entidad',
    action: 'Acción',
    dateFrom: 'Fecha desde',
    dateTo: 'Fecha hasta',
    reset: 'Restablecer filtros',
    all: 'Todos',
  },
  list: {
    title: 'Eventos de auditoría',
    subtitle: 'Consulta los eventos registrados en el sistema.',
    meta: {
      updating: 'Actualizando...',
      total: '{{count}} eventos',
    },
    columns: {
      date: 'Fecha y hora',
      actor: 'Actor',
      organization: 'Organización',
      action: 'Acción',
      entity: 'Entidad',
      detail: 'Detalle',
      actions: 'Acciones',
    },
  },
  realtime: {
    title: 'Actividad en tiempo real',
    live: 'En vivo',
  },
  summary: {
    title: 'Resumen de acciones',
    created: 'Creados',
    updated: 'Actualizados',
    deleted: 'Eliminados',
    login: 'Inicios de sesión',
    failedLogin: 'Fallos de login',
  },
  topEntities: {
    title: 'Top entidades modificadas',
  },
  actions: {
    view: 'Ver detalle',
    close: 'Cerrar',
  },
  detail: {
    title: 'Detalle del evento',
  },
  empty: {
    title: 'Sin eventos de auditoría',
    subtitle: 'Ajusta los filtros o ejecuta el seed demo para poblar la trazabilidad.',
  },
  loading: 'Cargando eventos de auditoría...',
  error: 'No se pudieron cargar los eventos de auditoría. Inténtalo de nuevo.',
  placeholders: {
    organization: 'Todas las organizaciones',
    actor: 'Todos los actores',
    entityType: 'Todas las entidades',
    action: 'Todas las acciones',
  },
  actors: {
    system: 'Sistema',
    unknown: 'Actor desconocido',
  },
  organizations: {
    platform: 'Plataforma',
    unknown: 'Sin asignar',
  },
  detailFallback: 'Evento de auditoría registrado en la plataforma.',
  relative: {
    now: 'Ahora',
    minutes: 'Hace {{count}} min',
    hours: 'Hace {{count}} h',
    days: 'Hace {{count}} d',
  },
  entities: {
    User: 'User',
    Organization: 'Organization',
    Plan: 'Plan',
    Subscription: 'Subscription',
    Product: 'Product',
    Course: 'Course',
    Auth: 'Auth',
  },
}
