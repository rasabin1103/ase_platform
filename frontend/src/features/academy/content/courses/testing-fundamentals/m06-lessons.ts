import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (misión 6). Ejemplos ajenos a «Dividir un gasto». */
export const m06Lessons: Lesson[] = [
  {
    id: 'pyramid',
    question: '¿Qué es la pirámide de pruebas?',
    conceptId: 'test_pyramid',
    cost: 5,
    body: `Una guía para repartir la automatización:

- **Base ancha de unitarias**: rápidas (milisegundos), baratas y precisas. Prueban la lógica (cálculos, validaciones, reglas).
- **Capa media de API / integración**: prueban que las piezas hablan bien entre sí y las reglas del servidor (permisos, contratos).
- **Punta estrecha de E2E**: pocos recorridos completos por la interfaz, los críticos. Son lentos y frágiles.

Si la pirámide se invierte (**cono de helado**: muchos E2E y pocas unitarias), la suite tarda una eternidad, falla sin motivo y el equipo deja de mirarla.`,
  },
  {
    id: 'levels',
    question: '¿Cómo decido el nivel de una comprobación?',
    conceptId: 'test_levels',
    cost: 5,
    body: `Pregúntate **dónde vive la regla** y en el nivel más bajo que pueda verla:

- Un cálculo de envío en una tienda online → **unitaria** del módulo que calcula.
- Que un cliente no pueda ver los pedidos de otro → **API**: la interfaz puede esconder el botón, pero la regla está en el servidor.
- «Comprar de punta a punta» → **un E2E**, no veinte.
- Lo que depende del tiempo (caducidades, recordatorios) → unitaria con **reloj simulado**: ningún E2E puede esperar tres días.`,
  },
  {
    id: 'mocks',
    question: 'Si cada parte tiene sus tests y pasan, ¿por qué falla al juntarlas?',
    conceptId: 'contract_testing',
    cost: 5,
    body: `Porque las unitarias usan **datos simulados (mocks)**: cada parte cumple **su** idea del acuerdo. Si la app envía euros y el servidor espera céntimos, las dos suites pasan… y el producto falla.

- Los **tests de contrato** (o de integración) comprueban el formato real que viaja entre las partes.
- Un E2E también lo vería, pero mucho más tarde y más caro.`,
  },
  {
    id: 'types',
    question: 'Además de los niveles, ¿qué tipos de prueba hay?',
    conceptId: 'test_types',
    cost: 5,
    body: `Los **niveles** dicen *dónde* (unitaria, integración, sistema, aceptación); los **tipos**, *qué característica* se prueba:

- **Funcionales**: ¿hace lo que debe?
- **No funcionales**: rendimiento, seguridad, usabilidad, accesibilidad. Necesitan su propia prueba: un E2E con 3 usuarios no dice nada del rendimiento con 20.
- **De cambio**: re-test y regresión.`,
  },
  {
    id: 'manual',
    question: '¿Hay cosas que no conviene automatizar?',
    conceptId: 'exploratory',
    cost: 5,
    body: `Sí. Automatizar compara contra un resultado esperado fijo; hay preguntas que **necesitan criterio humano**:

- ¿Se entiende la pantalla? ¿El texto es claro? ¿Es accesible de verdad con un lector de pantalla?
- Para eso, **pruebas exploratorias** con un objetivo y un tiempo acotado.
- Automatiza lo repetitivo y estable; explora lo nuevo y lo que depende del juicio.`,
  },
  {
    id: 'cost',
    question: '¿Por qué importa tanto lo que tarda la suite?',
    conceptId: 'test_pyramid',
    cost: 5,
    body: `Porque la suite se ejecuta **en cada cambio**. Una suite de 50 minutos significa que nadie espera el resultado antes de fusionar, y un 20 % de fallos intermitentes significa que nadie se cree el rojo.

- Objetivo habitual: **minutos**, no horas, para la suite que bloquea un cambio.
- Lo lento (rendimiento, E2E largos) va en ejecuciones **nocturnas** o antes de la release.`,
  },
]
