import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 2 · misión 2). Temario CTFL 2.1.3 y 4.5. */
export const m02Lessons: Lesson[] = [
  {
    id: 'test_first',
    question: '¿Qué tienen en común TDD, ATDD y BDD? (CTFL 2.1.3)',
    conceptId: 'test_first',
    cost: 5,
    body: `Los tres son enfoques **test-first**: las pruebas se definen **antes** que el código.

- **TDD**: el desarrollador escribe un test unitario, luego el código. Guía el diseño del código.
- **ATDD**: el equipo deriva pruebas de **aceptación** de los criterios antes de programar.
- **BDD**: el comportamiento se expresa en lenguaje natural (Dado/Cuando/Entonces) que negocio entiende y que se puede automatizar.

Aplican el principio de **testing temprano** (shift-left) y las pruebas resultantes suelen automatizarse y quedarse como regresión.`,
  },
  {
    id: 'three_c',
    question: '¿Qué son las 3C de una historia de usuario? (CTFL 4.5.1)',
    conceptId: 'user_story',
    cost: 5,
    body: `- **Card (tarjeta)**: el soporte de la historia, un recordatorio. «Como… quiero… para…».
- **Conversation (conversación)**: cómo se usará; los detalles salen hablando, no del papel.
- **Confirmation (confirmación)**: los **criterios de aceptación**.

Las historias se escriben **en colaboración** (negocio, desarrollo y pruebas: los «tres amigos»). Una buena historia cumple **INVEST**: independiente, negociable, valiosa, estimable, pequeña (*small*) y probable (*testable*).`,
  },
  {
    id: 'criteria',
    question: '¿Cómo se escriben los criterios de aceptación? (CTFL 4.5.2)',
    conceptId: 'acceptance_criteria',
    cost: 5,
    body: `Son las condiciones que la implementación debe cumplir para que la historia se acepte. Sirven para definir el alcance, llegar a un consenso, describir escenarios positivos y negativos, y como base de las pruebas de aceptación.

Dos formatos habituales:
- **Orientado a escenario**: Dado/Cuando/Entonces (BDD).
- **Orientado a reglas**: lista de verificación o tabla de entradas y salidas.

Deben ser **verificables**: «rápido» o «funciona bien» no sirven.`,
  },
  {
    id: 'atdd',
    question: '¿Cómo funciona ATDD paso a paso? (CTFL 4.5.3)',
    conceptId: 'atdd',
    cost: 5,
    body: `1. **Taller de especificación**: el equipo analiza la historia y sus criterios, y resuelve ambigüedades y huecos.
2. **Crear casos de prueba** a partir de los criterios: primero los **positivos** (comportamiento correcto sin excepciones), después los **negativos** y los no funcionales.
3. Escribir los casos en un formato que negocio entienda y que se pueda **automatizar**.
4. Se programa hasta que pasan.

Se pueden aplicar técnicas de caja negra (como valores límite) para elegir los ejemplos. Pasar las pruebas de aceptación no demuestra que no haya defectos.`,
  },
  {
    id: 'gherkin',
    question: '¿Qué hace bueno a un escenario Gherkin? (BDD)',
    conceptId: 'bdd',
    cost: 5,
    body: `- **Un comportamiento por escenario**: un solo Cuando.
- **Declarativo**: qué pasa («el cliente paga el enlace»), no cómo se pulsa («hago clic en Pagar»). Los pasos de interfaz hacen la suite frágil.
- **Entonces verificable**: un resultado observable y concreto.
- **Esquema del escenario** con **Ejemplos** cuando cambian los datos: ideal para valores límite (0,99 / 1,00 / 5.000,00 / 5.000,01).`,
  },
  {
    id: 'tdd',
    question: '¿Cuál es el ciclo de TDD? (CTFL 2.1.3)',
    conceptId: 'tdd',
    cost: 5,
    body: `1. **Rojo**: escribe un test pequeño para la siguiente regla y **ejecútalo**: debe fallar.
2. **Verde**: escribe el **código mínimo** para que pase.
3. **Refactor**: mejora el código (nombres, duplicados) con todos los tests en **verde**, y vuelve a ejecutarlos.

Cada regla especial (como una comisión mínima) entra con su propio test. Los tests quedan como regresión y guían el diseño.`,
  },
]
