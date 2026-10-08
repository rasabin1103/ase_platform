import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (misión 7). Ejemplos ajenos al incidente de Kobalto. */
export const m07Lessons: Lesson[] = [
  {
    id: 'order',
    question: 'Salta un incidente. ¿Por dónde empiezo?',
    conceptId: 'incident_response',
    cost: 5,
    body: `El orden importa:

1. **Mitigar**: reducir el daño cuanto antes (desactivar un flag, hacer un rollback, desviar tráfico). La causa raíz puede esperar; los clientes, no.
2. **Comunicar**: estado honesto y frecuente a soporte, negocio y clientes.
3. **Diagnosticar** la causa raíz y **reproducirla**.
4. **Corregir** y verificar.
5. **Postmortem** sin culpables.

En un incidente hay un **coordinador** (incident commander). QA aporta lo que mejor sabe hacer: acotar, reproducir y verificar.`,
  },
  {
    id: 'narrow',
    question: '¿Cómo encuentro qué está fallando en producción?',
    conceptId: 'observability',
    cost: 5,
    body: `Con los datos, como cuando aislabas una condición: **desglosa** la tasa de errores por una dimensión (operación, versión, sistema, tipo de cliente…), **filtra** lo que destaca y vuelve a desglosar por otra.

- Ejemplo: en una tienda online los pagos fallan al 4 %. Por método de pago: solo tarjetas. Por banco emisor: solo uno. Por importe: solo más de 500 €.
- Compara siempre con lo «normal»: una tasa del 0,3 % puede ser el ruido de siempre.
- **Correlación en el tiempo**: ¿empezó a la vez que el cambio? Un pico que sucede cada día a la misma hora no es la causa.`,
  },
  {
    id: 'mitigate',
    question: '¿Flag o rollback?',
    conceptId: 'mitigation',
    cost: 5,
    body: `- **Flag**: apaga solo la funcionalidad afectada en minutos. Requiere saber cuál es.
- **Rollback**: vuelve a la versión anterior entera. Más lento y te llevas por delante lo bueno de la versión.
- Desactivar flags **a ciegas** cuesta tiempo y no arregla nada: primero acota la funcionalidad.

Por eso conviene que lo nuevo salga detrás de un flag y con **despliegue gradual**: si falla, el daño es pequeño y se apaga rápido.`,
  },
  {
    id: 'communicate',
    question: '¿Qué le digo a Atención al cliente si aún no sé la causa?',
    conceptId: 'incident_response',
    cost: 5,
    body: `La verdad, con lo que sabes: **qué falla, a quién afecta, qué deben hacer los clientes y cuándo habrá novedades**.

- Ejemplo: «Algunos pagos con tarjeta de más de 500 € fallan desde las 10:00. No se ha cobrado nada. Recomendad reintentar en una hora o usar otro método. Próxima actualización a las 11:30.»
- Nunca culpes a terceros sin pruebas ni prometas plazos que no controlas.`,
  },
  {
    id: 'postmortem',
    question: '¿Qué es un postmortem sin culpables?',
    conceptId: 'postmortem',
    cost: 5,
    body: `Un análisis tras el incidente que busca **qué permitió el fallo**, no **quién** lo cometió. Las personas actúan razonablemente con la información que tienen; si el sistema dejó pasar el error, se cambia el sistema.

Contiene: **cronología**, **impacto**, **causa raíz**, **factores contribuyentes** (qué prueba, alerta o proceso faltó) y **acciones** concretas con responsable y fecha.`,
  },
  {
    id: 'shift',
    question: '¿Qué es eso de shift-left y shift-right?',
    conceptId: 'shift_right',
    cost: 5,
    body: `- **Shift-left**: encontrar los problemas antes (revisar requisitos, pruebas de contrato, datos de prueba realistas).
- **Shift-right**: aprender en producción de forma segura: monitorización y alertas por versión, despliegue gradual (*canary*), flags y pruebas sintéticas.

Un buen postmortem suele proponer de los dos: una prueba que lo habría detectado antes y una alerta o un despliegue que habría reducido el daño.`,
  },
]
