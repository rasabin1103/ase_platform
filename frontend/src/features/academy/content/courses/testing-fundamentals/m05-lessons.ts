import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (misión 5). Ejemplos ajenos a la release de Kobalto. */
export const m05Lessons: Lesson[] = [
  {
    id: 'risk_regression',
    question: 'No me da tiempo a toda la regresión. ¿Qué ejecuto?',
    conceptId: 'risk_based',
    cost: 5,
    body: `Prioriza por **riesgo = probabilidad × impacto**, y la probabilidad la marca sobre todo **lo que ha cambiado**.

- Lee las **notas de la versión**: código nuevo, fixes, parámetros y **dependencias** actualizadas.
- Empieza por lo que cambió y es crítico; sigue por lo que **comparte** piezas con lo que cambió.
- Lo que no cambió y no comparte nada puede ir al final… o quedarse sin ejecutar, **diciéndolo**.`,
  },
  {
    id: 'dependencies',
    question: 'Si una zona no cambia, ¿puedo saltármela?',
    conceptId: 'regression_selection',
    cost: 5,
    body: `No siempre. Una **librería compartida** actualizada (fechas, autenticación, redondeos) puede romper zonas que nadie ha tocado.

- Ejemplo: actualizar la librería de PDFs en un e-commerce puede romper las facturas, aunque el equipo solo cambió el carrito.
- Pregunta al equipo qué dependencias se han actualizado y **quién las usa**.
- El historial también cuenta: las zonas que ya fallaron suelen volver a fallar.`,
  },
  {
    id: 'exit_criteria',
    question: '¿Cuándo está «suficientemente probado»?',
    conceptId: 'exit_criteria',
    cost: 5,
    body: `Nunca está «todo probado». Por eso se acuerdan **criterios de salida** antes de empezar:

- Ningún bug crítico o alto abierto sin un plan (fix verificado, flag desactivado o aceptación explícita).
- Regresión de las zonas de **alto riesgo** ejecutada en el build final.
- Fallos de la integración continua **explicados**.
- **Riesgos conocidos** y lo no probado, documentados.`,
  },
  {
    id: 'go_nogo',
    question: '¿Cómo defiendo un GO o un NO-GO?',
    conceptId: 'go_nogo',
    cost: 5,
    body: `QA **recomienda con datos**; la decisión es del equipo y de negocio. Una buena recomendación tiene:

- **Qué se ha probado** (y en qué build) y **qué no**.
- **Bugs abiertos** con severidad y su plan.
- **Riesgos residuales** y cómo mitigarlos: flag, despliegue gradual, rollback, monitorización.
- Una frase final clara: «GO», «GO con condiciones» o «NO-GO hasta…».

«No me ha dado tiempo a probarlo todo» no es un argumento: nunca da tiempo.`,
  },
  {
    id: 'flaky',
    question: 'La integración continua tiene un test en rojo. ¿Bloqueo?',
    conceptId: 'flaky_tests',
    cost: 5,
    body: `Primero **investiga**: relanza y mira el **histórico**. Si a veces pasa y a veces falla sin cambios, es un test **inestable (flaky)**.

- Un flaky no bloquea, pero tampoco se ignora: márcalo y abre una tarea para estabilizarlo.
- Si un test falla siempre desde un cambio concreto, es un **fallo real**.
- Una suite con muchos flakys pierde valor: el equipo deja de mirarla.`,
  },
  {
    id: 'retest',
    question: 'Han subido un fix a mitad de tarde. ¿Qué repito?',
    conceptId: 'regression',
    cost: 5,
    body: `El **re-test** del caso que falló y la **regresión cercana**: lo que toca el mismo código. Si arreglan la comisión de las instantáneas, repite también la ordinaria.

- Todo resultado anterior al build nuevo está **caducado** para lo que haya cambiado.
- Por eso conviene encontrar los críticos **pronto**: un fix a las 15:30 apenas deja tiempo para verificarlo.`,
  },
]
