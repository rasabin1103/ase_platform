import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (misión 2). Ejemplos ajenos al simulador de préstamos. */
export const m02Lessons: Lesson[] = [
  {
    id: 'combinations',
    question: 'Hay muchas variables: ¿pruebo todas las combinaciones?',
    conceptId: 'combinatorial',
    cost: 5,
    body: `Imposible: 4 variables con 6 valores interesantes cada una son 1.296 combinaciones.

- **Base válida + una variable cada vez**: fija un caso que funciona y mueve solo una variable por sus particiones y bordes. Si falla, sabes exactamente por qué.
- **Combinaciones críticas aparte**: las reglas que mezclan variables (p. ej. «edad + años de carnet» en un seguro) se prueban en su propio borde.
- **Pairwise** (por pares): si necesitas más, cubre todas las parejas de valores con muchos menos casos que todas las combinaciones.`,
  },
  {
    id: 'oracle',
    question: '¿Cómo sé cuál es el resultado correcto?',
    conceptId: 'test_oracle',
    cost: 5,
    body: `Necesitas un **oráculo**: una fuente fiable del resultado esperado. Sin él, «me parece raro» es tu opinión contra la del desarrollador.

- La **especificación o política** (reglas, fórmulas).
- **Ejemplos validados** por quien sabe del negocio (una tabla de casos calculados).
- Un **sistema de referencia** (la versión anterior, una hoja de cálculo revisada).

En el bug report, escribe siempre el esperado **y de dónde sale**.`,
  },
  {
    id: 'calculations',
    question: '¿Cómo pruebo cálculos y redondeos?',
    conceptId: 'calculation_testing',
    cost: 5,
    body: `- Compara con el oráculo **al céntimo**: en dinero no hay «casi».
- Elige casos donde el redondeo importa: valores cuyo tercer decimal es 5 o más.
- Revisa la **coherencia interna**: ¿total = cuota × número de cuotas?, ¿intereses = total − importe?
- Prueba los **cambios de tramo** (tarifas, impuestos, comisiones) justo en el umbral.

Ejemplo ajeno: un IVA del 21 % sobre 9,99 € es 2,0979 → 2,10 €, no 2,09 €.`,
  },
  {
    id: 'combined_rules',
    question: '¿Cómo pruebo una regla que combina dos variables?',
    conceptId: 'boundary_values',
    cost: 5,
    body: `Busca el **borde de la combinación**, no el de cada variable.

Ejemplo ajeno: un seguro de coche exige «edad + años de carnet ≥ 25». Casos clave: 20 + 4 (24, por fuera), 20 + 5 (25, justo en el borde) y 20 + 6 (por dentro). Repite con otra combinación que sume lo mismo (18 + 7) para comprobar que la regla es la suma y no otra cosa.`,
  },
  {
    id: 'random',
    question: '¿Sirven las pruebas con datos aleatorios?',
    conceptId: 'random_vs_systematic',
    cost: 5,
    body: `Sirven para encontrar fallos inesperados (*fuzzing*), pero **no sustituyen al diseño**.

Un valor aleatorio entre 1 y 100.000 casi nunca cae en 17, 18, 70 o 10.000: justo donde están los bugs. Úsalos como complemento y pregunta siempre **qué cubren** las pruebas automáticas antes de darlas por buenas.`,
  },
  {
    id: 'non_functional',
    question: 'La app va lenta: ¿eso es cosa de QA?',
    conceptId: 'non_functional',
    cost: 5,
    body: `Sí: el **rendimiento** es calidad, igual que la seguridad o la usabilidad (pruebas no funcionales).

Pero antes de abrir un bug, **aísla la causa**: ¿es el sistema o el entorno (una migración, la red, otro equipo)? Anótalo como riesgo, mide cuando el entorno esté estable y reporta con datos (tiempos, condiciones).`,
  },
]
