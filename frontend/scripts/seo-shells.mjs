/**
 * Contenido SEO de las páginas públicas estáticas, en español (idioma por
 * defecto del sitio). Lo usa scripts/prerender-seo.mjs para generar, tras el
 * build, un HTML por ruta con título, descripción, canónica, datos
 * estructurados y un texto base que los buscadores y los previsualizadores de
 * enlaces leen sin ejecutar JavaScript. La aplicación React sustituye ese
 * texto al arrancar, así que un cambio de copy aquí NO altera lo que ve el
 * usuario: edita esta tabla cuando cambie el posicionamiento de una página.
 */

export const SITE_URL = 'https://www.arcesabinengineering.com'
export const SITE_NAME = 'Arce Sabin Engineering'

export const SHELLS = [
  {
    path: '/',
    title: 'Arce Sabin Engineering | Formación, herramientas y consultoría de calidad de software',
    description:
      'Formación práctica por simulación en QA y automatización, biblioteca de recursos, herramientas ejecutables y consultoría de calidad de software para profesionales y empresas.',
    h1: 'Calidad de software, aprendida y aplicada',
    intro:
      'Arce Sabin Engineering reúne formación práctica por simulación, una biblioteca de libros y recursos, herramientas que puedes ejecutar y consultoría en QA, automatización y arquitectura de calidad.',
    links: [
      ['/academy', 'Academy: cursos con misiones prácticas'],
      ['/catalog', 'Catálogo de cursos, libros y recursos'],
      ['/pricing', 'Planes y precios'],
      ['/services', 'Qué incluye la suscripción'],
      ['/blog', 'Blog de calidad de software'],
      ['/contact', 'Contacto y consultoría'],
    ],
  },
  {
    path: '/about',
    title: 'Sobre Arce Sabin Engineering | Quiénes somos',
    description:
      'Conoce a Arce Sabin Engineering: especialistas en calidad de software, automatización de pruebas y arquitectura, y cómo trabajamos con equipos y profesionales.',
    h1: 'Sobre Arce Sabin Engineering',
    intro:
      'Somos un equipo especializado en calidad de software: QA, automatización de pruebas y arquitectura de calidad, con formación, herramientas y consultoría.',
    links: [['/story', 'Nuestra historia'], ['/services', 'Servicios'], ['/contact', 'Contacto']],
  },
  {
    path: '/story',
    title: 'Nuestra historia | Arce Sabin Engineering',
    description:
      'La historia de Arce Sabin Engineering: de la experiencia en proyectos reales de calidad de software a una plataforma de formación, herramientas y consultoría.',
    h1: 'Nuestra historia',
    intro: 'Cómo nació Arce Sabin Engineering y qué problemas de calidad de software queremos resolver.',
    links: [['/about', 'Sobre ASE'], ['/academy', 'Academy'], ['/contact', 'Contacto']],
  },
  {
    path: '/services',
    title: 'Qué incluye ASE | Biblioteca, herramientas, empleo y consultoría',
    description:
      'Descubre qué incluye la suscripción de ASE: biblioteca de contenidos, herramientas ejecutables, ofertas laborales con análisis y reservas de consultoría.',
    h1: 'Qué incluye ASE',
    intro:
      'Recorrido por todo lo que ofrece la plataforma: biblioteca, herramientas para probar, empleo asistido, formación y consultoría.',
    links: [['/pricing', 'Comparar planes'], ['/catalog', 'Ver el catálogo'], ['/academy', 'Academy']],
  },
  {
    path: '/platform',
    title: 'La plataforma ASE | Arquitectura, roles y automatización',
    description:
      'Cómo está construida la plataforma de ASE: flujos, organizaciones, roles y permisos, facturación, auditoría y automatización.',
    h1: 'La plataforma ASE',
    intro: 'La arquitectura que hay detrás de ASE, módulo a módulo.',
    links: [['/services', 'Qué incluye'], ['/pricing', 'Planes'], ['/contact', 'Contacto']],
  },
  {
    path: '/pricing',
    title: 'Planes y precios | Arce Sabin Engineering',
    description:
      'Compara los planes de ASE, mensuales y anuales, qué incluye cada uno y cómo se relacionan con las compras individuales de cursos, libros y recursos.',
    h1: 'Planes y precios',
    intro:
      'Elige el plan que encaja contigo. Las compras individuales de cursos y recursos son adicionales y conservan el acceso aunque canceles el plan.',
    links: [['/catalog', 'Catálogo'], ['/services', 'Qué incluye'], ['/contact', 'Hablar con nosotros']],
  },
  {
    path: '/catalog',
    title: 'Catálogo de cursos, libros y recursos de QA | Arce Sabin Engineering',
    description:
      'Explora el catálogo de ASE: cursos prácticos de QA, libros y recursos de calidad de software con precios visibles y muestras gratuitas.',
    h1: 'Catálogo',
    intro: 'Cursos, libros y recursos para profesionales de la calidad de software.',
    links: [['/academy', 'Academy'], ['/pricing', 'Planes'], ['/blog', 'Blog']],
  },
  {
    path: '/academy',
    title: 'Academy | Cursos de QA con misiones prácticas',
    description:
      'Aprende QA, automatización, gestión de calidad y SQL con misiones prácticas por simulación. La primera misión de cada curso es gratuita y sin registro.',
    h1: 'Academy',
    intro:
      'Cursos de QA con misiones prácticas por simulación: Fundamentos, QA Profesional, Karate, Gestión QA y SQL.',
    links: [['/catalog', 'Catálogo de cursos'], ['/pricing', 'Planes'], ['/register', 'Crear cuenta']],
  },
  {
    path: '/blog',
    title: 'Blog de calidad de software | Arce Sabin Engineering',
    description:
      'Artículos sobre QA, automatización de pruebas y arquitectura de calidad, con enfoque práctico para equipos y profesionales.',
    h1: 'Blog',
    intro: 'Artículos sobre calidad de software, automatización y buenas prácticas de QA.',
    links: [['/academy', 'Academy'], ['/catalog', 'Catálogo'], ['/contact', 'Contacto']],
  },
  {
    path: '/contact',
    title: 'Contacto | Arce Sabin Engineering',
    description:
      'Escríbenos para consultoría de QA, automatización o arquitectura de calidad, o para resolver dudas sobre planes y formación.',
    h1: 'Contacto',
    intro: 'Cuéntanos qué necesitas y te respondemos en el plazo indicado en el formulario.',
    links: [['/services', 'Servicios'], ['/pricing', 'Planes'], ['/about', 'Sobre ASE']],
  },
  {
    path: '/redeem',
    title: 'Canjear código | Arce Sabin Engineering',
    description: 'Canjea tu código de acceso de ASE para activar el contenido que has adquirido.',
    h1: 'Canjear código',
    intro: 'Introduce tu código para activar el contenido asociado a tu compra.',
    links: [['/catalog', 'Catálogo'], ['/login', 'Iniciar sesión']],
  },
  {
    path: '/privacy-policy',
    title: 'Política de privacidad | Arce Sabin Engineering',
    description: 'Cómo tratamos tus datos personales en ASE: finalidades, proveedores, conservación y tus derechos.',
    h1: 'Política de privacidad',
    intro: 'Información sobre el tratamiento de datos personales en la plataforma.',
    links: [['/terms-of-service', 'Términos del servicio'], ['/contact', 'Contacto']],
  },
  {
    path: '/terms-of-service',
    title: 'Términos del servicio | Arce Sabin Engineering',
    description: 'Condiciones de uso de ASE: suscripciones, renovación, cancelación, licencias e impuestos.',
    h1: 'Términos del servicio',
    intro: 'Condiciones que regulan el uso de la plataforma y la contratación de planes y productos.',
    links: [['/privacy-policy', 'Política de privacidad'], ['/pricing', 'Planes']],
  },
]

/** Página 404: noindex y vuelta al contenido principal. */
export const NOT_FOUND_SHELL = {
  title: 'Página no encontrada | Arce Sabin Engineering',
  description: 'La página que buscas no existe o ha cambiado de dirección.',
  h1: 'Página no encontrada',
  intro: 'La dirección que has abierto no existe o se ha movido. Prueba con alguno de estos enlaces.',
  links: [['/', 'Ir al inicio'], ['/catalog', 'Catálogo'], ['/academy', 'Academy'], ['/contact', 'Contacto']],
}
