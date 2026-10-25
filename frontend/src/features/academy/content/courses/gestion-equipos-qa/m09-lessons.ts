import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 9 · rol QA Manager). */
export const m09Lessons: Lesson[] = [
  {
    id: 'priority',
    question: '¿Por dónde empiezo a recortar?',
    conceptId: 'risk_priority',
    cost: 5,
    body: `Por **lo que menos riesgo cubre**, no por igual en todos los equipos:
1. Duplicidades sin valor (dos herramientas que hacen lo mismo).
2. Lo de bajo riesgo: externalizar o dejar de probar a mano, **con negocio informado y de acuerdo**.
3. Bajas que no se reponen, antes que despidos.

Lo crítico (dinero de clientes, regulador) y las personas que lo sostienen, **lo último**.`,
  },
  {
    id: 'plan',
    question: '¿Qué es un plan de capacidad?',
    conceptId: 'capacity_plan',
    cost: 5,
    body: `Para cada palanca: **cuánto ahorra**, **qué riesgo deja sin cubrir** y **a quién afecta**.

Un buen plan:
- llega al objetivo;
- deja intacto lo crítico;
- conserva a las personas clave;
- dice qué cuesta (menos margen) y cuándo se revisa.

«Un 20 % a cada equipo» no es un plan: es no decidir.`,
  },
  {
    id: 'people',
    question: '¿Quiénes son las personas clave?',
    conceptId: 'key_people',
    cost: 5,
    body: `Las que sostienen el riesgo crítico o una capacidad que nadie más tiene: quien conoce pagos y antifraude, o quien sabe hacer pruebas de carga antes de una campaña.

En un recorte son **las primeras que reciben ofertas**. Retenerlas no siempre es dinero: un reto real, visibilidad y un compromiso que puedas cumplir. Nunca prometas lo que no tienes.`,
  },
  {
    id: 'comms',
    question: '¿Cómo comunico un recorte?',
    conceptId: 'honest_comms',
    cost: 5,
    body: `- **Pronto:** el rumor siempre llega antes. Si aún no hay decisiones, dilo y da una fecha.
- **Completo:** qué cambia, por qué, qué no cambia y cómo afecta a cada uno.
- **Sin adornos:** no es «una oportunidad».
- **Con espacio:** preguntas abiertas y 1:1 con sus leads.

Ni negar lo que el equipo intuye ni adelantar decisiones que no están tomadas.`,
  },
  {
    id: 'scope',
    question: 'Si dejo de probar algo, ¿a quién se lo digo?',
    conceptId: 'scope_acceptance',
    cost: 5,
    body: `A **quien es dueño del riesgo**: negocio. Explícale qué se deja de probar y qué podría fallar, y que lo **acepte por escrito**.

Si lo escondes («no vas a notar nada»), cuando falle será culpa de QA y nadie habrá decidido nada.`,
  },
  {
    id: 'say_no',
    question: 'El CTO propone externalizar todo. ¿Qué hago?',
    conceptId: 'risk_priority',
    cost: 5,
    body: `Separa: **lo de bajo riesgo sí**, lo crítico no, y explícalo con el **coste de que falle** frente al ahorro.

Cerrarte a todo («ni hablar») te deja sin argumentos. Aceptarlo todo («vale») traslada el riesgo a quien no conoce el dominio.`,
  },
]
