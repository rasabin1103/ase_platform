import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (misión 4). Ejemplos ajenos a la app de tarjetas. */
export const m04Lessons: Lesson[] = [
  {
    id: 'anatomy',
    question: '¿Qué tiene un buen bug report?',
    conceptId: 'bug_report',
    cost: 5,
    body: `Un report bueno se reproduce **sin preguntarte nada**.

- **Título**: qué falla, dónde y en qué condición. «El carrito vacía los productos al cambiar de idioma en Android», no «el carrito no va».
- **Entorno**: dispositivo, sistema, versión de la app, idioma, tipo de cuenta, build.
- **Pasos mínimos**, uno por línea, con los datos exactos.
- **Esperado** (y de dónde sale) y **obtenido**.
- **Evidencia**: la captura o la ejecución que lo muestra; solo la que importa.
- **Severidad** y **prioridad**, por separado.`,
  },
  {
    id: 'isolate',
    question: 'El cliente dice varias cosas a la vez. ¿Cuál es la causa?',
    conceptId: 'isolation',
    cost: 5,
    body: `**Aísla**: cambia **una condición cada vez** y mira cuándo aparece y desaparece el fallo.

- Ejemplo: «En mi tablet, con la app en francés, al pagar con cupón falla». Prueba sin cupón, luego en español, luego en móvil… hasta que una sola condición lo encienda y lo apague.
- Lo que no influye **no va en los pasos**: solo añade ruido.
- Un report con la condición exacta ahorra horas al desarrollador.`,
  },
  {
    id: 'severity_priority',
    question: '¿Severidad y prioridad no son lo mismo?',
    conceptId: 'severity_priority',
    cost: 5,
    body: `No. **Severidad** = cuánto daño hace el fallo. **Prioridad** = cuándo hay que arreglarlo. La severidad la propone QA; la prioridad se decide con negocio en el **triaje**.

- **Baja severidad, alta prioridad**: una errata en el logo de la portada el día de un lanzamiento.
- **Alta severidad, baja prioridad**: un fallo grave en una función que usan tres clientes y que tiene alternativa.
- No infles la severidad para que algo se arregle antes: si todo es crítico, nada lo es.`,
  },
  {
    id: 'environment',
    question: '¿Por qué a mí me falla y al desarrollador no?',
    conceptId: 'environment',
    cost: 5,
    body: `Casi siempre es el **entorno** o los **datos**: otro dispositivo, otro idioma, otro tipo de usuario, otra secuencia de pasos o una fecha concreta.

- Anota siempre el entorno completo, aunque creas que no importa.
- Si el dev no lo reproduce, no discutas: **compara entornos** y busca la diferencia.
- «En mi máquina funciona» es una pista, no un veredicto.`,
  },
  {
    id: 'not_a_bug',
    question: '¿Todo lo que dice un cliente es un bug?',
    conceptId: 'not_a_bug',
    cost: 5,
    body: `No. Antes de reportar, compara con la **especificación**: muchas quejas son comportamiento esperado que el cliente no entiende (una retención temporal en el banco, un redondeo legal, una regla de negocio).

- Si funciona como está definido, no es un bug: ayuda a **Atención al cliente** con una explicación clara.
- Si el comportamiento confunde a muchos clientes, propón una **mejora** (texto, aviso), no un bug.`,
  },
  {
    id: 'tone',
    question: '¿Cómo escribo sin que el desarrollador se lo tome mal?',
    conceptId: 'bug_report',
    cost: 5,
    body: `Describe **hechos**, no personas: «al guardar 1,000 se guarda 1 €», no «otra vez habéis roto el límite».

- Sin adjetivos («horrible», «absurdo»), sin mayúsculas, sin culpables.
- Si el dev te devuelve el report, **complétalo** con lo que pide: no es un ataque, es que le falta información.
- Agradece el fix y verifícalo pronto: la confianza se construye en las dos direcciones.`,
  },
]
