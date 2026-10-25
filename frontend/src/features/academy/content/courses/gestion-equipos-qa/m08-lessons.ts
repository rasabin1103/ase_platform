import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 4 · misión 8 · rol QA Manager). */
export const m08Lessons: Lesson[] = [
  {
    id: 'profile',
    question: '¿Cómo defino el perfil de una vacante?',
    conceptId: 'hiring_profile',
    cost: 5,
    body: `Desde **lo que le falta al equipo**, no desde el anuncio de siempre:
- ¿Qué no sabe hacer nadie? (aquí, rendimiento)
- ¿Qué se queda sin hacer? (automatización en el pipeline)
- ¿Qué necesita el resto? (acompañar a junior, explicar riesgos)

Fuera los filtros que no predicen el trabajo: títulos, años inflados, «conoce nuestra herramienta» (se aprende en semanas) o un «que encaje» sin definir.`,
  },
  {
    id: 'structured',
    question: '¿Qué es una entrevista estructurada?',
    conceptId: 'structured_interview',
    cost: 5,
    body: `- **Las mismas preguntas** para todos los candidatos.
- **Un ejercicio realista**, parecido al trabajo (revisar y ampliar una suite), no acertijos.
- **Una tarjeta** con los criterios del perfil y una escala (de 1 a 4) con ejemplos de cada nivel.
- **Cada entrevistador puntúa por separado** antes del debate, para que no se contagien.

Y rápido: dos entrevistas en una semana y respuesta en 48 horas.`,
  },
  {
    id: 'bias',
    question: '¿Qué sesgos aparecen al contratar?',
    conceptId: 'interview_bias',
    cost: 5,
    body: `- **Afinidad:** nos gusta quien se parece a nosotros («no es el perfil de siempre»).
- **Halo:** una cosa buena (conversación brillante) tiñe todo lo demás.
- **Primera impresión:** los nervios del principio pesan más que el ejercicio.
- **Conflicto de interés:** un entrevistador amigo del candidato.

Antídotos: tarjeta, puntuación individual, la pregunta «¿qué evidencia tenemos?» y apartar a quien tiene un conflicto.`,
  },
  {
    id: 'fair',
    question: 'Un directivo me recomienda a alguien. ¿Qué hago?',
    conceptId: 'fair_process',
    cost: 5,
    body: `Bienvenida la recomendación: es una buena fuente de candidatos. Pero **el mismo proceso y la misma tarjeta** que el resto.

Saltarse el proceso es injusto con los demás y con el propio candidato: si entra sin evaluar, el equipo lo sabrá. Y descartarlo por quién lo recomienda también es injusto.`,
  },
  {
    id: 'no',
    question: '¿Cómo digo que no a alguien con poder?',
    conceptId: 'say_no_with_data',
    cost: 5,
    body: `- **Con los datos de la misma tarjeta** que usaste para todos.
- Reconoce lo bueno: «comunica muy bien».
- Explica qué faltaba frente a lo que necesita el equipo.
- Ofrece una salida: feedback para el candidato o encaje en otro puesto.

«No encajaba» suena a personal. Un dato comparado con el resto, no.`,
  },
  {
    id: 'onboarding',
    question: '¿La contratación acaba con la firma?',
    conceptId: 'onboarding_plan',
    cost: 5,
    body: `No. Los buenos candidatos tienen otras ofertas: **respuesta rápida**, el mismo día si puedes.

Y el **onboarding** es parte de contratar:
- un **buddy** de su equipo;
- un **plan de 30, 60 y 90 días**;
- el **primer 1:1 con su lead** el primer día.

Sin eso, una buena contratación tarda meses en notarse.`,
  },
]
