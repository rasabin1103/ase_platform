/**
 * Private `/onboarding` copy (EN + ES) — the "create or join an
 * organization" page shown to a user with no real org yet. Merged into
 * translations.ts as `onboardingPage`. The join/invite sections below this
 * page's own "create organization" card already use `orgMembership.onboarding.*`
 * — this file only covers the parts that were previously hardcoded English.
 */

export const onboardingPageEn = {
  badge: 'Onboarding',
  yourAccount: 'your account',
  welcomeTitle: 'Welcome, {{name}}',
  welcomeBody:
    "You don't have an organization yet. Create one to start, create your personal space, join an existing organization, or accept an invite.",
  create: {
    title: 'Create organization',
    subtitle: 'Primary path for teams and businesses.',
    submit: 'Create organization',
    submitting: 'Creating…',
    error: 'Could not create organization. Check slug duplicates/permissions.',
  },
  individual: {
    title: 'Personal space',
    subtitle: 'Quick setup for solo work.',
    submit: 'Create my personal space',
    submitting: 'Creating…',
    error: 'Could not create your space. Please try again.',
  },
}

export const onboardingPageEs = {
  badge: 'Primeros pasos',
  yourAccount: 'tu cuenta',
  welcomeTitle: 'Bienvenido/a, {{name}}',
  welcomeBody:
    'Todavía no tienes una organización. Crea una para empezar, crea tu espacio personal, únete a una organización existente o acepta una invitación.',
  create: {
    title: 'Crear organización',
    subtitle: 'Vía principal para equipos y empresas.',
    submit: 'Crear organización',
    submitting: 'Creando…',
    error: 'No se pudo crear la organización. Puede que ese identificador ya esté en uso: prueba con otro.',
  },
  individual: {
    title: 'Espacio personal',
    subtitle: 'Para usar ASE por tu cuenta, sin equipo.',
    submit: 'Crear mi espacio personal',
    submitting: 'Creando…',
    error: 'No se pudo crear tu espacio. Inténtalo de nuevo.',
  },
}
