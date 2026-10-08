import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (misión 1). Ejemplos ajenos a KOB-151. */
export const m01Lessons: Lesson[] = [
  {
    id: 'review_story',
    question: '¿Cómo reviso una historia antes de que se desarrolle?',
    conceptId: 'static_testing',
    cost: 5,
    body: `Léela **frase a frase** preguntándote: «¿cómo lo probaría?». Si no sabes qué resultado esperar, hay un defecto en el requisito.

- Busca **palabras vagas**: «adecuado», «rápido», «los mismos que», «etc.».
- Busca lo que **falta**: ¿y si…? (vacío, máximo, error, cancelación, otro tipo de usuario).
- Compara la **descripción con los ejemplos**: a veces se contradicen.
- Anota cada duda con su tipo y **mándasela a la PO antes de que empiece el desarrollo**.`,
  },
  {
    id: 'defect_types',
    question: '¿Qué tipos de defectos tienen los requisitos?',
    conceptId: 'requirement_defects',
    cost: 5,
    body: `- **Ambiguo**: admite varias interpretaciones. «El descuento se aplica a clientes antiguos» (¿desde cuándo?).
- **Incompleto**: falta un caso o una regla. «El usuario puede subir una foto» (¿tamaño máximo?, ¿formatos?).
- **Contradictorio**: dos partes dicen cosas incompatibles. «Solo para empresas» y luego «ejemplo: Ana compra para su casa».
- **No verificable**: no hay forma objetiva de comprobarlo. «La pantalla debe ser intuitiva».

Una misma frase puede tener más de un problema: elige el principal.`,
  },
  {
    id: 'testable',
    question: '¿Qué hace que un criterio sea verificable?',
    conceptId: 'testable_criteria',
    cost: 5,
    body: `Un criterio es verificable si dos personas distintas, probándolo, llegarían al **mismo veredicto**.

- «La búsqueda es rápida» ✗ → «La búsqueda devuelve resultados en menos de 1 segundo con 10.000 productos» ✓
- «El formulario es fácil» ✗ → «5 de 5 usuarios completan el alta sin ayuda en menos de 2 minutos» ✓

Si no puedes escribir el resultado esperado de un caso de prueba, el criterio no es verificable todavía.`,
  },
  {
    id: 'gwt',
    question: '¿Cómo escribo criterios como ejemplos?',
    conceptId: 'given_when_then',
    cost: 5,
    body: `El formato **Dado / Cuando / Entonces** convierte reglas vagas en ejemplos concretos que todo el equipo entiende igual:

- **Dado** un carrito con 3 productos de 10 €
- **Cuando** aplico el cupón VERANO10
- **Entonces** el total es 27 €

Proponer ejemplos así en el refinamiento es una de las mejores formas que tiene QA de evitar bugs antes de que existan.`,
  },
  {
    id: 'shift_left',
    question: '¿Por qué es más barato encontrarlo ahora?',
    conceptId: 'shift_left',
    cost: 5,
    body: `Un defecto encontrado en el **requisito** cuesta una pregunta. El mismo defecto encontrado en **staging** cuesta desarrollar, probar, reportar, corregir y volver a probar. En **producción**, además, clientes afectados y reputación.

Por eso QA participa desde el refinamiento (*shift-left*): la mejor forma de encontrar un bug es evitar que se escriba.`,
  },
  {
    id: 'scope_change',
    question: '¿Qué hago si cambian los requisitos a mitad de sprint?',
    conceptId: 'scope_change',
    cost: 5,
    body: `Los cambios son normales; lo peligroso es meterlos **por la puerta de atrás**.

- Pide que se registren en el ticket (qué cambia y por qué).
- Valora el impacto con el equipo: ¿cambia la estimación?, ¿hay que re-probar algo?
- Que lo decida quien prioriza (PO), a la vista de todos.

Un «díselo directamente a Diego» suele acabar en un cambio sin probar y sin que nadie lo sepa.`,
  },
  {
    id: 'dates',
    question: '¿Cómo pruebo campos de fecha?',
    conceptId: 'boundary_values',
    cost: 5,
    body: `Las fechas son una mina de valores límite y particiones:

- **Bordes**: ayer, hoy, mañana; el máximo permitido y un día más.
- **Calendario**: fines de semana, festivos, meses de 28, 29, 30 y 31 días, años bisiestos, cambio de año.
- **Relaciones**: fecha de fin antes, igual y después de la de inicio.

Ejemplo ajeno: una reserva de hotel «hasta 90 días vista» → prueba hoy, 90 y 91 días; salida antes, igual y después de la entrada.`,
  },
]
