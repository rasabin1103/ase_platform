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
    "You don't have an organization yet. Create one to start, create an individual workspace, join an existing organization, or accept an invite.",
  create: {
    title: 'Create organization',
    subtitle: 'Primary path for teams and businesses.',
    submit: 'Create organization',
    submitting: 'Creating…',
    error: 'Could not create organization. Check slug duplicates/permissions.',
  },
  individual: {
    title: 'Individual workspace',
    subtitle: 'Quick setup for solo work.',
    submit: 'Create individual workspace',
    submitting: 'Creating…',
    error: 'Could not create the workspace. Please try again.',
  },
}

export const onboardingPageEs = {
  badge: 'Onboarding',
  yourAccount: 'tu cuenta',
  welcomeTitle: 'Bienvenido/a, {{name}}',
  welcomeBody:
    'Todavía no tienes una organización. Crea una para empezar, crea un workspace individual, únete a una organización existente o acepta una invitación.',
  create: {
    title: 'Crear organización',
    subtitle: 'Vía principal para equipos y empresas.',
    submit: 'Crear organización',
    submitting: 'Creando…',
    error: 'No se pudo crear la organización. Revisa duplicados de identificador o permisos.',
  },
  individual: {
    title: 'Workspace individual',
    subtitle: 'Configuración rápida para trabajo en solitario.',
    submit: 'Crear workspace individual',
    submitting: 'Creando…',
    error: 'No se pudo crear el workspace. Inténtalo de nuevo.',
  },
}
