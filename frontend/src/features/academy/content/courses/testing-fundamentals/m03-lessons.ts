import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (misión 3). Ejemplos ajenos a la consola de cobros. */
export const m03Lessons: Lesson[] = [
  {
    id: 'states',
    question: '¿Cómo se prueba algo que tiene estados?',
    conceptId: 'state_transition',
    cost: 5,
    body: `Dibuja el **diagrama de estados**: cajas (estados) y flechas (acciones que llevan de uno a otro). Piensa en un pedido online: «Recibido → Enviado → Entregado», y desde «Recibido» también «Cancelado».

- **Cobertura de transiciones válidas**: cada flecha, al menos un caso (también la que nadie usa).
- **Comprueba el estado de llegada**, no solo que «no da error».
- Con el diagrama a la vista, las flechas que faltan saltan a la vista.`,
  },
  {
    id: 'invalid',
    question: '¿Por qué probar lo que no se puede hacer?',
    conceptId: 'invalid_transitions',
    cost: 5,
    body: `Porque ahí están los bugs caros. Monta una **tabla de estados**: filas = estados, columnas = acciones. Cada celda sin flecha es una **transición inválida** que el sistema debe rechazar sin cambiar nada.

- ¿Se puede «entregar» un pedido «cancelado»? ¿«Enviar» uno ya «entregado»?
- Que la interfaz oculte el botón no basta: la API, otro canal o un doble clic pueden llegar igual.
- Prioriza las inválidas que **mueven dinero o datos** y los **estados finales**: deberían ser finales.`,
  },
  {
    id: 'decision_table',
    question: '¿Qué es una tabla de decisión?',
    conceptId: 'decision_table',
    cost: 5,
    body: `Una forma de escribir reglas que combinan **condiciones**. Ejemplo de un gimnasio: «¿es socio?», «¿es hora valle?» → precio de la clase.

- **Condiciones** en filas (sí/no), **reglas** en columnas, **acción** (resultado) abajo.
- Cada **columna es al menos un caso de prueba**.
- Escribirla te obliga a ver combinaciones que nadie definió: preguntar es parte de la técnica.`,
  },
  {
    id: 'dont_care',
    question: 'La tabla tiene guiones (–). ¿Qué pruebo ahí?',
    conceptId: 'decision_table',
    cost: 5,
    body: `Un guion significa «**indiferente**»: la regla dice que esa condición no cambia el resultado. Una columna con dos guiones esconde **cuatro combinaciones**.

- Prueba al menos **una combinación distinta por cada guion** que importe por riesgo.
- El bug típico es el **orden de las reglas** en el código: una regla más general se evalúa antes y «se come» a la que debería ganar.
- Si una condición tiene un límite (p. ej. «hasta 30 días»), combínala con **valores límite**: 30 y 31.`,
  },
  {
    id: 'sequences',
    question: '¿Basta con probar cada transición una vez?',
    conceptId: 'switch_coverage',
    cost: 5,
    body: `No siempre. Probar cada flecha suelta es la cobertura básica (**0-switch**). Muchos bugs aparecen en **secuencias**: dos flechas seguidas (**1-switch**) o un ciclo.

- Ejemplo de una biblioteca: «prestar → devolver → prestar» al mismo socio, o «renovar» dos veces seguidas.
- Las secuencias que **acumulan** algo (importes, contadores, intentos) son las más peligrosas: cada paso parece correcto y la suma no.
- Y la que vuelve atrás: tras «ganar una disputa», ¿vuelve al estado anterior o a uno por defecto?`,
  },
  {
    id: 'test_data',
    question: '¿Cómo llego rápido a un estado concreto?',
    conceptId: 'test_data',
    cost: 5,
    body: `Recorrer el camino entero cada vez cuesta tiempo. Por eso los equipos tienen **generadores de datos de prueba** («fixtures», «seeds») que crean el objeto ya en el estado que necesitas.

- Úsalos para **preparar** el caso; la prueba es la acción que viene después.
- Pero recorre el camino real al menos una vez: un estado creado «a mano» puede no ser idéntico al que se alcanza de verdad.
- Apunta qué datos usaste: sin ellos, el bug no se puede reproducir.`,
  },
  {
    id: 'incidents',
    question: '¿De dónde saco ideas de casos?',
    conceptId: 'incident_learning',
    cost: 5,
    body: `Además de la especificación: de las **incidencias pasadas**. Lo que ya falló en producción suele volver con otra forma.

- Pregunta a Soporte, Operaciones o Riesgos qué les ha dolido últimamente.
- Convierte cada incidencia en un **caso de regresión** permanente.
- Si una incidencia vino de un sistema antiguo, compruébala en el nuevo: los bugs se migran con los requisitos.`,
  },
]
