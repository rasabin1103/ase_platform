import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 2 · misión 3). Temario CTFL 4.3 y 2.2.1. */
export const m03Lessons: Lesson[] = [
  {
    id: 'whitebox',
    question: '¿Qué aporta la caja blanca que no aporta la caja negra? (CTFL 4.3.3)',
    conceptId: 'white_box',
    cost: 5,
    body: `Las técnicas de **caja blanca** se basan en la **estructura interna** del objeto de prueba (el código).

- Miden qué parte del código ha ejecutado la suite (**cobertura**) y señalan lo que nadie ha probado.
- Se pueden aplicar aunque la especificación sea vaga o esté desactualizada.

Su gran **debilidad**: no detectan lo que **falta**. Si un requisito no está implementado, no hay código que cubrir. Por eso se combinan con caja negra.`,
  },
  {
    id: 'statement',
    question: '¿Cómo se calcula la cobertura de sentencias? (CTFL 4.3.1)',
    conceptId: 'statement_cov',
    cost: 5,
    body: `**Cobertura de sentencias = sentencias ejecutadas ÷ sentencias ejecutables × 100.**

- Con 100 %, cada sentencia se ha ejecutado al menos una vez: si una línea tiene un defecto, alguna prueba ha pasado por él.
- Pero pasar por un defecto **no garantiza provocar el fallo** (depende de los datos) y, sobre todo, alguien tiene que **comprobar el resultado**.
- No garantiza probar toda la lógica de decisión: un «si» sin «sino» puede no haberse probado nunca con la condición falsa.`,
  },
  {
    id: 'branch',
    question: '¿Qué añade la cobertura de ramas? (CTFL 4.3.2)',
    conceptId: 'branch_cov',
    cost: 5,
    body: `Una **rama** es una transferencia de control entre dos nodos del grafo de flujo: cada decisión tiene una rama **verdadera** y otra **falsa**.

**Cobertura de ramas = ramas ejecutadas ÷ ramas totales × 100.**

- Cuenta también la rama falsa de un «si» sin «sino», que no tiene sentencias propias.
- **100 % de ramas implica 100 % de sentencias**; al revés, no.
- Es la cobertura que más se exige en código crítico.`,
  },
  {
    id: 'calc',
    question: '¿Cómo calculo la cobertura de un conjunto de casos? (K3)',
    conceptId: 'branch_cov',
    cost: 5,
    body: `1. Numera las **sentencias ejecutables** y marca las **decisiones**, cada una con sus ramas V y F.
2. Para cada caso, sigue el camino y apunta qué sentencias y ramas recorre.
3. Une todo lo recorrido por la suite y divide entre el total.

Ejemplo: 11 sentencias, 3 decisiones (6 ramas). Si la suite recorre las 11 sentencias y 5 ramas: **100 % de sentencias y 83 % de ramas**.`,
  },
  {
    id: 'limits',
    question: '¿Por qué un 100 % de cobertura puede no detectar nada?',
    conceptId: 'coverage_limits',
    cost: 5,
    body: `La cobertura mide lo **ejecutado**, no lo **comprobado**:

- Un test **sin aserción** ejecuta código y siempre pasa.
- Un resultado esperado **copiado de lo que devuelve el código** convierte el bug en «comportamiento esperado».
- El resultado esperado sale del **oráculo**: la especificación, no la implementación.

La cobertura es un buen **indicador de lo que falta**, no una medida de calidad de la suite.`,
  },
  {
    id: 'component',
    question: '¿Qué son las pruebas de componente? (CTFL 2.2.1)',
    conceptId: 'component_testing',
    cost: 5,
    body: `Prueban **componentes aislados** (una función, una clase, un módulo).

- Suelen escribirlas los **desarrolladores**, a menudo con TDD y en el entorno de desarrollo.
- A veces necesitan simuladores, *stubs* o *drivers* para aislar el componente.
- Es el nivel donde más se usa la **cobertura de código** como criterio.`,
  },
]
