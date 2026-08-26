/** Private `/booking` (client) and `/admin/booking` (admin) copy (EN + ES).
 * Merged as root keys `bookingPage` and `adminBookingPage`. */

export const bookingPageEn = {
  heroBadge: 'QA consulting',
  title: 'Book a consulting session',
  subtitle: 'Pick an open slot below and confirm — you and our team both get an email confirmation instantly.',
  available: {
    title: 'Available slots',
    hint: 'Times are shown in UTC. Once booked, a slot is no longer available to other clients.',
    empty: 'No open slots right now — check back soon.',
    loadError: 'Could not load available slots.',
    duration: '{{minutes}} min',
    notesLabel: 'Anything you want us to know? (optional)',
    notesPlaceholder: 'e.g. we would like to cover our CI flakiness backlog',
    book: 'Book this slot',
    booking: 'Booking…',
    bookError: 'Could not book this slot — it may have just been taken. Try another one.',
    bookSuccess: 'Session booked — check your email for the confirmation.',
  },
  mine: {
    title: 'My bookings',
    empty: 'You have no upcoming sessions booked.',
    loadError: 'Could not load your bookings.',
    cancel: 'Cancel booking',
    cancelConfirm: 'Cancel this session? The slot will become available to other clients.',
    cancelError: 'Could not cancel this booking.',
    cancelSuccess: 'Booking cancelled.',
    status: { open: 'Open', booked: 'Confirmed', cancelled: 'Cancelled' },
  },
}

export const bookingPageEs = {
  heroBadge: 'Consultoría QA',
  title: 'Reserva una sesión de consultoría',
  subtitle: 'Elige una franja disponible y confirma — tú y nuestro equipo recibiréis un email de confirmación al instante.',
  available: {
    title: 'Franjas disponibles',
    hint: 'Las horas se muestran en UTC. Una vez reservada, la franja deja de estar disponible para otros clientes.',
    empty: 'No hay franjas disponibles ahora mismo — vuelve a comprobarlo pronto.',
    loadError: 'No se pudieron cargar las franjas disponibles.',
    duration: '{{minutes}} min',
    notesLabel: '¿Algo que quieras contarnos? (opcional)',
    notesPlaceholder: 'ej. nos gustaría revisar nuestro backlog de tests inestables en CI',
    book: 'Reservar esta franja',
    booking: 'Reservando…',
    bookError: 'No se pudo reservar esta franja — puede que la acaben de coger. Prueba con otra.',
    bookSuccess: 'Sesión reservada — revisa tu correo para ver la confirmación.',
  },
  mine: {
    title: 'Mis reservas',
    empty: 'No tienes sesiones próximas reservadas.',
    loadError: 'No se pudieron cargar tus reservas.',
    cancel: 'Cancelar reserva',
    cancelConfirm: '¿Cancelar esta sesión? La franja quedará disponible para otros clientes.',
    cancelError: 'No se pudo cancelar esta reserva.',
    cancelSuccess: 'Reserva cancelada.',
    status: { open: 'Abierta', booked: 'Confirmada', cancelled: 'Cancelada' },
  },
}

export const adminBookingPageEn = {
  heroBadge: 'Booking calendar',
  title: 'Consulting session availability',
  subtitle: 'Open slots for clients to book, and see who has booked what — no external scheduling tool required.',
  create: {
    title: 'Open new slots',
    hint: 'Add one or more start times (UTC) and a duration — each becomes an independently bookable slot.',
    addTime: 'Add another time',
    duration: 'Duration (minutes)',
    submit: 'Create slots',
    submitting: 'Creating…',
    success: 'Slots created.',
    error: 'Could not create the slots.',
  },
  list: {
    title: 'All slots',
    empty: 'No slots yet — create some above.',
    loadError: 'Could not load slots.',
    columns: { date: 'Date', duration: 'Duration', status: 'Status', bookedBy: 'Booked by', notes: 'Notes', actions: 'Actions' },
    status: { open: 'Open', booked: 'Booked', cancelled: 'Cancelled' },
    deleteConfirm: 'Delete this open slot?',
    deleteError: 'Could not delete this slot — it may already be booked.',
    delete: 'Delete',
  },
}

export const adminBookingPageEs = {
  heroBadge: 'Calendario de reservas',
  title: 'Disponibilidad de sesiones de consultoría',
  subtitle: 'Abre franjas para que los clientes reserven, y consulta quién ha reservado cada una — sin herramienta externa.',
  create: {
    title: 'Abrir nuevas franjas',
    hint: 'Añade una o más horas de inicio (UTC) y una duración — cada una se convierte en una franja reservable de forma independiente.',
    addTime: 'Añadir otra hora',
    duration: 'Duración (minutos)',
    submit: 'Crear franjas',
    submitting: 'Creando…',
    success: 'Franjas creadas.',
    error: 'No se pudieron crear las franjas.',
  },
  list: {
    title: 'Todas las franjas',
    empty: 'Aún no hay franjas — crea alguna arriba.',
    loadError: 'No se pudieron cargar las franjas.',
    columns: { date: 'Fecha', duration: 'Duración', status: 'Estado', bookedBy: 'Reservado por', notes: 'Notas', actions: 'Acciones' },
    status: { open: 'Abierta', booked: 'Reservada', cancelled: 'Cancelada' },
    deleteConfirm: '¿Eliminar esta franja abierta?',
    deleteError: 'No se pudo eliminar esta franja — puede que ya esté reservada.',
    delete: 'Eliminar',
  },
}
