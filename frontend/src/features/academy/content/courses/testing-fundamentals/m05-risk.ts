import type { RiskModel } from '../../../engine/types'

/** Priorización por riesgo de la release 5.1 (referencia de un QA senior). */
export const m05Risk: RiskModel = {
  topN: 3,
  submitCost: 5,
  reviewer: 'laura',
  items: [
    {
      id: 'instant',
      label: 'Transferencias instantáneas (motor de comisiones nuevo)',
      description: 'Cambio grande en la 5.1, con dinero de clientes y campaña el lunes.',
      reference: { p: 3, i: 3, why: 'Código nuevo que cobra dinero: muy probable que falle y, si falla, afecta a todos los que la usen desde el lunes.' },
    },
    {
      id: 'auth',
      label: 'Acceso y sesión (librería de autenticación actualizada)',
      description: 'Login con contraseña, huella y Face ID; caducidad de la sesión.',
      reference: { p: 2, i: 3, why: 'Una actualización de librería parece pequeña, pero si el login o la sesión fallan, falla todo (o hay un riesgo de seguridad).' },
    },
    {
      id: 'cards',
      label: 'Tarjetas (fix de congelar en Android)',
      description: 'Corrección del bug de la beta.',
      reference: { p: 2, i: 3, why: 'Los fixes rompen cosas cerca: si se arregla congelar, hay que probar descongelar.' },
    },
    {
      id: 'loans',
      label: 'Préstamos (nuevo TIN 5,75 % desde 10.000 €)',
      description: 'Cambio de un parámetro del tramo.',
      reference: { p: 2, i: 2, why: 'Cambio pequeño, pero en un umbral clásico de «>» frente a «>=».' },
    },
    {
      id: 'scheduled',
      label: 'Transferencias programadas',
      description: 'Sin cambios funcionales en la 5.1.',
      reference: { p: 2, i: 2, why: 'No cambia la funcionalidad, pero la 5.1 actualiza la librería de fechas que usa: riesgo indirecto.' },
    },
    {
      id: 'payments',
      label: 'Cobros (Kobalto Pay)',
      description: 'Sin cambios en la 5.1.',
      reference: { p: 1, i: 3, why: 'Impacto alto, pero nada ha cambiado ni comparte dependencias tocadas.' },
    },
    {
      id: 'onboarding',
      label: 'Onboarding, textos y accesibilidad',
      description: 'Textos nuevos del onboarding.',
      reference: { p: 2, i: 1, why: 'Cambian los textos, pero un fallo aquí no bloquea a nadie.' },
    },
  ],
}
