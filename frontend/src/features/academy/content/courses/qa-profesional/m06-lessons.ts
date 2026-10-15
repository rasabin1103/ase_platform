import type { Lesson } from '../../../engine/types'

/** Microlecciones de Laura (curso 2 · misión 6). Temario CTFL 5.3 y 1.4. */
export const m06Lessons: Lesson[] = [
  {
    id: 'metrics',
    question: '¿Qué métricas se usan en las pruebas? (CTFL 5.3.1)',
    conceptId: 'test_metrics',
    cost: 5,
    body: `Las métricas muestran el avance frente al calendario y al presupuesto, la calidad del objeto de prueba y la eficacia de las pruebas. Las habituales:

- **progreso del proyecto**: tareas, esfuerzo y coste;
- **progreso de las pruebas**: casos preparados y ejecutados frente al plan, pasados y fallados;
- **calidad del producto**: disponibilidad, tiempo de respuesta, fallos;
- **defectos**: por severidad, prioridad y estado; densidad; porcentaje detectado;
- **riesgo**: riesgo residual;
- **cobertura**: de requisitos, historias o código;
- **coste**: de las pruebas y de la calidad.

Una métrica sirve si ayuda a **decidir**. El volumen sin contexto (casos ejecutados, bugs por persona) no ayuda.`,
  },
  {
    id: 'misleading',
    question: '¿Cuándo engaña una métrica?',
    conceptId: 'test_metrics',
    cost: 5,
    body: `Casi nunca porque el número sea falso, sino porque está **incompleto**:

- **100 % de casos pasados** sobre una parte pequeña de los requisitos;
- **defectos cerrados** que se cerraron sin verificar;
- **cero defectos** en un módulo que nadie ha probado.

Regla práctica: cruza cada número con su contexto (cobertura, cómo se cerró, cuánto se ha probado) antes de reportarlo.`,
  },
  {
    id: 'reports',
    question: '¿Qué diferencia hay entre el informe de progreso y el de cierre? (CTFL 5.3.2)',
    conceptId: 'progress_report',
    cost: 5,
    body: `- **Progreso**: periódico, mientras se prueba. Estado, avance frente al plan, impedimentos, métricas, riesgos nuevos o cambiados y lo previsto para el siguiente periodo.
- **Cierre**: al terminar un hito, sprint o proyecto. Resumen, evaluación de la calidad, desviaciones frente al plan y los criterios de salida, defectos sin resolver, riesgo residual, métricas finales y lecciones aprendidas.

Los dos deben decir también lo que **no** salió bien.`,
  },
  {
    id: 'audience',
    question: '¿Cómo se comunica el estado de las pruebas? (CTFL 5.3.3)',
    conceptId: 'status_comm',
    cost: 5,
    body: `Depende de la **audiencia** y del contexto:

- **dirección** necesita estado, riesgo y la decisión que se le pide, en un vistazo;
- **el equipo** necesita el detalle para trabajar: qué falta, quién lo hace, qué bloquea.

Formas: conversación, paneles (incluidos los de CI/CD o los tableros del equipo), canales electrónicos (correo, chat), documentación en línea e informes formales. Un mismo informe rara vez sirve a todos.`,
  },
  {
    id: 'control',
    question: '¿Qué es el control de las pruebas? (CTFL 5.3)',
    conceptId: 'test_control',
    cost: 5,
    body: `El **seguimiento** compara lo real con lo planificado. El **control** usa esa información para dar **directivas** y corregir el rumbo:

- repriorizar las pruebas cuando un riesgo cambia;
- reevaluar si se cumplen los criterios de entrada o de salida;
- ajustar el calendario;
- añadir recursos donde hace falta;
- renegociar el alcance con las partes interesadas.

Esconder datos o forzar números no es control: es perder la información que necesitas para decidir.`,
  },
  {
    id: 'closure',
    question: '¿Qué se hace en el cierre de las pruebas? (CTFL 1.4.1)',
    conceptId: 'test_closure',
    cost: 5,
    body: `Ocurre en los hitos del proyecto: fin de una release, de una iteración o de un nivel de prueba.

- Comprobar que se cumplen los **criterios de salida** y documentar las desviaciones.
- Registrar los **defectos sin resolver** como peticiones de cambio o elementos del backlog.
- **Archivar** el testware útil y entregarlo a quien corresponda (mantenimiento, otros equipos).
- Analizar las **lecciones aprendidas** para mejorar el proceso.
- Elaborar el **informe de cierre** y comunicarlo.`,
  },
]
